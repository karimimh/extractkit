import json
import os
import re
from collections import Counter

from django.utils import timezone

PRICE_PATTERN = re.compile(r"(?:[$€£]\s?\d[\d,.]*|\d[\d,.]*\s?(?:usd|eur|gbp))", re.I)
CATEGORY_PATTERNS = {
    "price": re.compile(r"price|pricing|cost|discount|sale|[$€£]", re.I),
    "availability": re.compile(r"in stock|out of stock|sold out|available|unavailable|inventory", re.I),
    "cta": re.compile(r"buy now|sign up|subscribe|get started|contact us|book|free trial|call to action", re.I),
    "policy": re.compile(r"terms|privacy|policy|refund|return|legal|agreement|compliance", re.I),
    "seo": re.compile(r"meta|description|title|canonical|robots|seo|heading|h1", re.I),
}


def _serialized_change(change):
    before = json.dumps(change.before.data, ensure_ascii=False, sort_keys=True, default=str)
    after = json.dumps(change.after.data, ensure_ascii=False, sort_keys=True, default=str)
    return before[:12000], after[:12000]


def _heuristic_analysis(change):
    before, after = _serialized_change(change)
    combined = f"{before}\n{after}\n{change.diff}"
    categories = [category for category, pattern in CATEGORY_PATTERNS.items() if pattern.search(combined)]
    old_prices = PRICE_PATTERN.findall(before)
    new_prices = PRICE_PATTERN.findall(after)
    if old_prices != new_prices and "price" not in categories:
        categories.append("price")

    importance = "high" if any(category in categories for category in ("price", "availability", "policy")) else "medium" if categories else "low"
    insignificant = importance == "low" and change.changed_percent < 2
    if old_prices != new_prices and old_prices and new_prices:
        summary = f"Price information changed from {old_prices[0]} to {new_prices[0]}."
    elif categories:
        summary = f"The page changed in {', '.join(categories)} content ({change.changed_percent:.2f}% changed)."
    else:
        summary = f"The page content changed by {change.changed_percent:.2f}%."
    why = {
        "price": "Pricing changes can affect purchasing decisions and competitive positioning.",
        "availability": "Availability changes can affect sales, fulfillment, and customer expectations.",
        "cta": "CTA changes can alter how visitors convert or contact the business.",
        "policy": "Policy changes may introduce legal, compliance, or customer-impacting obligations.",
        "seo": "SEO changes can affect search visibility and how the page appears in results.",
    }.get(categories[0] if categories else "", "Review the change to confirm whether it affects tracked business information.")
    return {
        "summary": summary,
        "importance": importance,
        "categories": categories or ["content"],
        "why_it_matters": why,
        "insignificant": insignificant,
        "source": "rules",
    }


def _openai_analysis(change):
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    use_openai = os.getenv("AI_CHANGE_USE_OPENAI", "false").lower() in {"1", "true", "yes"}
    if not api_key or not use_openai:
        return None
    before, after = _serialized_change(change)
    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=os.getenv("OPENAI_BASE_URL") or None)
    response = client.chat.completions.create(
        model=os.getenv("AI_CHANGE_MODEL", "gpt-4o-mini"),
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Analyze a monitored webpage change. Return JSON with summary (one plain-language sentence), "
                    "importance (low, medium, or high), categories (subset of price, availability, cta, policy, seo, content), "
                    "why_it_matters (one sentence), and insignificant (boolean). Mark insignificant only for clearly trivial "
                    "changes with no likely business impact."
                ),
            },
            {"role": "user", "content": f"Changed percent: {change.changed_percent}\nBefore:\n{before}\nAfter:\n{after}"},
        ],
    )
    payload = json.loads(response.choices[0].message.content or "{}")
    importance = payload.get("importance") if payload.get("importance") in {"low", "medium", "high"} else "medium"
    categories = [item for item in payload.get("categories", []) if item in {"price", "availability", "cta", "policy", "seo", "content"}]
    return {
        "summary": str(payload.get("summary") or change.summary)[:2000],
        "importance": importance,
        "categories": categories or ["content"],
        "why_it_matters": str(payload.get("why_it_matters") or "")[:2000],
        "insignificant": bool(payload.get("insignificant", False)),
        "source": "openai",
    }


def analyze_change(change):
    try:
        analysis = _openai_analysis(change) or _heuristic_analysis(change)
    except Exception:
        analysis = _heuristic_analysis(change)
    change.ai_summary = analysis["summary"]
    change.ai_importance = analysis["importance"]
    change.ai_categories = analysis["categories"]
    change.ai_why_it_matters = analysis["why_it_matters"]
    change.ai_insignificant = analysis["insignificant"]
    change.ai_analysis_source = analysis["source"]
    change.ai_analyzed_at = timezone.now()
    if change.monitor.auto_ignore_insignificant and change.ai_insignificant:
        change.status = change.IGNORED
    change.save(update_fields=[
        "ai_summary", "ai_importance", "ai_categories", "ai_why_it_matters", "ai_insignificant",
        "ai_analysis_source", "ai_analyzed_at", "status",
    ])
    return change


def weekly_intelligence_summary(changes):
    changes = list(changes)
    categories = Counter(category for change in changes for category in change.ai_categories)
    important = [change for change in changes if change.ai_importance == "high"]
    return {
        "summary": f"{len(changes)} changes detected across {len({change.monitor_id for change in changes})} monitors; {len(important)} were high importance.",
        "change_count": len(changes),
        "monitor_count": len({change.monitor_id for change in changes}),
        "high_importance_count": len(important),
        "categories": dict(categories),
        "highlights": [
            {"change_id": str(change.public_id), "monitor": change.monitor.name or change.monitor.url, "summary": change.ai_summary or change.summary}
            for change in important[:10]
        ],
    }

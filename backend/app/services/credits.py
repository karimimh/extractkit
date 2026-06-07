from django.conf import settings
from django.db import transaction

from ..models import CreditTransaction, UserProfile


class InsufficientCredits(Exception):
    def __init__(self, action, required, available):
        self.action = action
        self.required = required
        self.available = available
        super().__init__(
            f"Insufficient credits for '{action}': requires {required}, has {available}."
        )


def credit_cost(action):
    costs = getattr(settings, "CREDIT_COSTS", {})
    try:
        return int(costs[action])
    except KeyError:
        raise KeyError(f"No credit cost configured for action '{action}'.")


def get_balance(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.download_credits


def has_credits(user, action, units=1):
    return get_balance(user) >= credit_cost(action) * units


@transaction.atomic
def charge(user, action, units=1, *, reference=""):
    amount = credit_cost(action) * units
    profile = (
        UserProfile.objects.select_for_update().get_or_create(user=user)[0]
    )
    if profile.download_credits < amount:
        raise InsufficientCredits(action, amount, profile.download_credits)

    profile.download_credits -= amount
    profile.save(update_fields=["download_credits"])

    CreditTransaction.objects.create(
        user=user,
        kind=CreditTransaction.SPEND,
        action=action,
        amount=-amount,
        balance_after=profile.download_credits,
        reference=reference,
    )
    return profile.download_credits


@transaction.atomic
def grant(user, credits, *, action="", reference="", kind=CreditTransaction.GRANT):
    credits = int(credits)
    profile = (
        UserProfile.objects.select_for_update().get_or_create(user=user)[0]
    )
    profile.download_credits += credits
    profile.save(update_fields=["download_credits"])

    CreditTransaction.objects.create(
        user=user,
        kind=kind,
        action=action,
        amount=credits,
        balance_after=profile.download_credits,
        reference=reference,
    )
    return profile.download_credits

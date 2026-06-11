from django.conf import settings
from django.db import transaction

from ..models import CreditTransaction, UserProfile


class InsufficientCredits(Exception):
    def __init__(self, action, required, available):
        self.action = action
        self.required = required
        self.available = available
        super().__init__(
            f"Insufficient balance for '{action}': requires {required} cents, has {available} cents."
        )


def credit_cost(action):
    costs = getattr(settings, "USAGE_PRICES_CENTS", {})
    try:
        return int(costs[action])
    except KeyError:
        raise KeyError(f"No usage price configured for action '{action}'.")


def get_balance(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.balance_cents


def has_credits(user, action, units=1):
    return get_balance(user) >= credit_cost(action) * units


@transaction.atomic
def charge(user, action, units=1, *, reference=""):
    amount = credit_cost(action) * units
    profile = (
        UserProfile.objects.select_for_update().get_or_create(user=user)[0]
    )
    if profile.balance_cents < amount:
        raise InsufficientCredits(action, amount, profile.balance_cents)

    profile.balance_cents -= amount
    profile.save(update_fields=["balance_cents"])

    CreditTransaction.objects.create(
        user=user,
        kind=CreditTransaction.SPEND,
        action=action,
        amount=-amount,
        balance_after=profile.balance_cents,
        reference=reference,
    )
    return profile.balance_cents


@transaction.atomic
def grant(user, credits, *, action="", reference="", kind=CreditTransaction.GRANT):
    credits = int(credits)
    profile = (
        UserProfile.objects.select_for_update().get_or_create(user=user)[0]
    )
    profile.balance_cents += credits
    profile.save(update_fields=["balance_cents"])

    CreditTransaction.objects.create(
        user=user,
        kind=kind,
        action=action,
        amount=credits,
        balance_after=profile.balance_cents,
        reference=reference,
    )
    return profile.balance_cents

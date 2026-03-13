from fastapi import APIRouter
from app.api import auth, buyers, pingtree, reports, users, public_leads, forms, validation, public_forms, public_banks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["login"])
api_router.include_router(buyers.router, prefix="/buyers", tags=["buyers"])
api_router.include_router(pingtree.router, prefix="/leads", tags=["leads"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(validation.router, prefix="/validation", tags=["validation"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(public_leads.router, prefix="/public/leads", tags=["public"])
api_router.include_router(public_forms.router, prefix="/public/forms", tags=["public"])
api_router.include_router(public_banks.router, prefix="/public/banks", tags=["public"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])

from app.api import domain_mappings, webhooks
api_router.include_router(domain_mappings.router, prefix="/domain-mappings", tags=["domain-mappings"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

# Test Routes (for local verification)
from app.api import test_routes
api_router.include_router(test_routes.router, prefix="/test", tags=["test"])


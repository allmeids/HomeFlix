from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app import database

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

class ProfileCreate(BaseModel):
    name: str
    avatar: Optional[str] = "spiderman"

class ProfileOnboarding(BaseModel):
    preferred_genres: str

@router.get("")
def list_profiles():
    return {"profiles": database.get_profiles()}

@router.get("/{profile_id}")
def get_profile(profile_id: int):
    p = database.get_profile_by_id(profile_id)
    if not p:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return {"profile": p}

@router.post("")
def add_profile(data: ProfileCreate):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Nome não pode ser vazio")
    profile = database.create_profile(data.name.strip(), data.avatar or "spiderman")
    return {"profile": profile}

@router.put("/{profile_id}")
def edit_profile(profile_id: int, data: ProfileCreate):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Nome não pode ser vazio")
    profile = database.update_profile(profile_id, data.name.strip(), data.avatar or "spiderman")
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return {"profile": profile}

@router.post("/{profile_id}/onboarding")
def complete_onboarding(profile_id: int, data: ProfileOnboarding):
    profile = database.save_profile_onboarding(profile_id, data.preferred_genres)
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return {"profile": profile, "status": "ok"}

@router.delete("/{profile_id}")
def remove_profile(profile_id: int):
    database.delete_profile(profile_id)
    return {"status": "ok"}


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app import database

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

class ProfileCreate(BaseModel):
    name: str
    avatar: Optional[str] = "🦊"

@router.get("")
def list_profiles():
    return {"profiles": database.get_profiles()}

@router.post("")
def add_profile(data: ProfileCreate):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Nome não pode ser vazio")
    profile = database.create_profile(data.name.strip(), data.avatar or "🦊")
    return {"profile": profile}

@router.delete("/{profile_id}")
def remove_profile(profile_id: int):
    database.delete_profile(profile_id)
    return {"status": "ok"}

from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from db.db_session import get_db
from data_access.file_handling import FileStorage
from pydantic import BaseModel
import passlib.hash as _hash

router = APIRouter(prefix="")

class DownloadSchema(BaseModel):
    code: int

async def verify_code(code:str,hashed_code):
    return 

@router.post("/fileinfo")
async def download(download: DownloadSchema):
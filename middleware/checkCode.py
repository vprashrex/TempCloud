# check the codes does exist in the database
from sqlalchemy import orm as _orm
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from fastapi import Depends
from data_access.file_handling import FileStorage
import sqlalchemy.ext.declarative as _declarative



DATABASE_URI = "sqlite:///file.db"
engine = create_engine(DATABASE_URI,connect_args={"check_same_thread":False})
Session = sessionmaker(bind=engine,autocommit=False,autoflush=False)

Base = _declarative.declarative_base()



def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()


class FileRepo:
    @staticmethod
    async def find_by_code(code:str,db):
        query = db.query(FileStorage).filter(FileStorage.code == code).first()
        if query is not None:
            return query
        else:
            return None



async def check_code(code:str,db:_orm.Session=Depends(get_db)):
    file_query = await FileRepo.find_by_code(code,db)
    print(file_query)

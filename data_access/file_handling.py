from sqlalchemy import Column,String,DateTime,Integer
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class FileStorage(Base):
    __tablename__ = "file"

    id = Column(String,primary_key=True)
    file_name = Column(String,index=True,nullable=False)
    expiration_date = Column(DateTime,nullable=False)
    code = Column(String,nullable=False)
    size = Column(Integer,nullable=False)

    @property
    def expiration_date_in_seconds(self):
        return datetime.timetuple(self.expiration_date)


    def dict(self):
        return {
            "id": self.id,
            "file_name": self.file_name,
            "expiration_data": self.expiration_date,
            "code": self.code,
            "size": self.size
        }
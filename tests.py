

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from data_access.file_handling import FileStorage


session_maker = sessionmaker(bind=create_engine("sqlite:///file.db"))

''' db = session_maker()

def verify_code(code,hashed_code):
    _hash.bcrypt.verify(code,hashed_code) '''


''' time_str = "0:10:20.522800".split(".")[0]
s = datetime.datetime.strptime(time_str,"%H:%M:%S").time()
print(tuple(str(s).split(":"))) '''

with session_maker() as session:

    files = session.query(FileStorage).all()
    for file in files:
        print(file.dict())
        ''' s = round((file.expiration_date - datetime.datetime.now()).total_seconds() * 1000)
        print(s) '''
    session.commit()
from fastapi import FastAPI,Request,status,BackgroundTasks,UploadFile,File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse,JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from data_access.file_handling import FileStorage
import os,random,uuid,bcrypt,datetime,aiofiles,asyncio


origins = [
    "*"
]

app = FastAPI(docs_url=None,redoc_url=None)
app.add_middleware(

    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"]
)

VERSION = "0.1"
MAX_FILE_SIZE = 1024 * 1024  * 1


app.mount("/static",StaticFiles(directory="./static"),name="static")
templates = Jinja2Templates(directory="./templates/")

@app.get("/",response_class=HTMLResponse)
async def index(request:Request):
    return templates.TemplateResponse("index.html",context={"request":request})

@app.get("/api/",response_class=HTMLResponse)
async def api(request:Request):
    return templates.TemplateResponse("index.html",context={"request":request})


class FileUpload(BaseModel):
    expiration: int
    code: str = None
    token: str = None


async def generate_random() -> str:
    
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    random_string = ""
    for i in range(4):
        character = random.choice(characters)
        if random.random() < 0.5:
            character = str(random.randint(0, 9))

        random_string += character
    
    return random_string

DATABASE_URL = "sqlite:///file.db"
engine = create_engine(DATABASE_URL)
session = sessionmaker(bind=engine,autoflush=False)

class MaxBodySizeException(Exception):
    def __init__(self,body_len:int):
        self.body_len = body_len
    
class MaxBodySizeValidator:
    def __init__(self,max_size: int,file):
        self.max_size = max_size
        self.size = file.size
    
    def __call__(self):
        if self.size > self.max_size:
            raise MaxBodySizeException(body_len=self.size)


class FileSize(BaseModel):
    size: int

async def delete_file(file):
    file_path = f"uploads/{file.id}_{file.file_name}"
    os.remove(file_path)

async def delete_expired_files():
    while True:
        with session() as db:
            expired_files = db.query(FileStorage).filter(FileStorage.expiration_date < datetime.datetime.now()).all()
            for file in expired_files:
                file_path = f"uploads/{file.id}_{file.file_name}"
                os.remove(file_path)
                db.delete(file)
            db.commit()
        
        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(delete_expired_files())

async def generate_uuid():
    return str(uuid.uuid4())

async def codeEncoder(code: str):
    loop = asyncio.get_event_loop()
    hashed = await loop.run_in_executor(None,bcrypt.hashpw,code.encode("utf-8"),bcrypt.gensalt(6))
    return hashed



CHUNK_SIZE = 1024 * 1024 * 10 # 10 MB CHUNK SIZE



from urllib.parse import quote
from fastapi.responses import FileResponse
from io import BytesIO
import zipfile
from fastapi.responses import StreamingResponse
import tempfile

@app.get("/api/download/{filename}")
async def download(filename: str,code:str):
    try:
        with session() as sess:
            file_info = sess.query(FileStorage).filter(FileStorage.code == code).all()
            
            if len(file_info) == 1:
                file = file_info[0]
                file_path = f"uploads/{file.id}_{file.file_name}"
                encoded_filename = quote(filename)
                return FileResponse(file_path,filename=filename,headers={"Content-Disposition": f"attachment; filename={encoded_filename}"})
            else:
                zip_data = BytesIO()
                with zipfile.ZipFile(zip_data,mode="w",compression=zipfile.ZIP_DEFLATED) as zip_file:
                    for file in file_info:
                        file_path = f"uploads/{file.id}_{file.file_name}"
                        zip_file.write(file_path,arcname=file.file_name)
                zip_data.seek(0)
                temp_file = tempfile.NamedTemporaryFile(delete=False)
                temp_file.write(zip_data.getvalue())
                temp_file.close()
                return FileResponse(temp_file.name,filename=filename, media_type="application/zip", headers={"Content-Disposition": f"attachment; filename={filename}.zip"})

    except Exception as e:
        print(e)
        return JSONResponse(
            content={"error":str(e)},
            status_code=400
        )

''' @app.post("/api/?{c}")
async def download_from_link(c: str):
    try:
        print(c)
    except Exception as e:
        print(e)
        return JSONResponse(
            status_code=400,
            content={
                "error":"Error Occured!"
            }
        ) '''


@app.post("/api/fileinfo")
async def file_info(code:str):
    try:
        sess = session()
        file_info = sess.query(FileStorage).filter(FileStorage.code == code).all()
        if not file_info:
            return JSONResponse(
                content={"error":"Code not found!"},
                status_code=status.HTTP_404_NOT_FOUND
            )
        else:
            if len(file_info) == 1:
                expiration = file_info[0].expiration_date - datetime.datetime.now()
                expiration_in_ms = round((expiration.total_seconds() * 1000))
                return JSONResponse(
                    content={
                        "length":len(file_info),
                        "filename": file_info[0].file_name,
                        "size": file_info[0].size,
                        "expiration": expiration_in_ms,
                        "code": file_info[0].code
                    },
                    status_code=200
                )
            else:

                expiration = file_info[0].expiration_date - datetime.datetime.now()
                expiration_in_ms = round((expiration.total_seconds() * 1000))
                size = [file.size for file in file_info]

                return JSONResponse(
                    content={
                        "length":len(file_info),
                        "size": size,
                        "code": file_info[0].code,
                        "expiration":expiration_in_ms
                    }
                )

    except Exception as e:
        print(e)
        return JSONResponse(
            content={"error":str(e)},
            status_code=400
        )


class GroupFiles:
    def __init__(self,code:str):
        self.db = session()
        self.file_codes = self.db.query(FileStorage).filter(FileStorage.code == code).first()

    async def if_code_exist(self):
        '''
            function will check is the code exist in the database
        '''
        if self.file_codes is not None:
            return True
        else:
            return None

    async def get_expiry_date(self):
        return self.file_codes.expiration_date    



async def save_file_to_disk(file_id: int, filename: str, file: UploadFile):
    if not os.path.exists("uploads"):
        os.makedirs("uploads",exist_ok=True)
    
    async with aiofiles.open(f"uploads/{file_id}_{filename}","wb") as f:
        contents = await file.read()
        await f.write(contents)
    


@app.post("/api/file-upload")
async def upload_file(background_tasks: BackgroundTasks,expiration:int,code:str=None,token:str=None,file: UploadFile = File(...)):
    try:
        if not file.filename:
            return JSONResponse(
                content={"error":"Some Error occured!"},
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        id = await generate_uuid()
        group_files = GroupFiles(code)

        if await group_files.if_code_exist():
            code = code
            expiration = await group_files.get_expiry_date()

        else:
            expiration = datetime.datetime.now() + datetime.timedelta(milliseconds=expiration)
            code = await generate_random()
        
        background_tasks.add_task(save_file_to_disk,id,file.filename,file)
        db = session()
        db_file = FileStorage(
            id = id,
            file_name = file.filename,
            expiration_date = expiration,
            code = code,
            size = file.size
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)

        
        return JSONResponse(
            content={"code":code,"filename":file.filename},
            status_code=200
        )

    except Exception as e:
        print(e)
        return JSONResponse(
            content={
                "error":str(e)
            },
            status_code=400
        )

    finally:
        db.close()





''' @app.on_event("startup")
async def startup_event():
    db = session()
    expired_files = db.query(FileStorage).filter(FileStorage.expiration_date < datetime.datetime.now()).all()

    async def delete_file(file):
        file_path = f"uploads/{file.id}_{file.file_name}"
        os.remove(file_path)
        db.delete(file)
    
    tasks = [delete_file(file) for file in expired_files]
    await asyncio.gather(*tasks)
    db.commit()
 '''

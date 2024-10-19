import uuid


# 生成uuid
def new_id():
    id = uuid.uuid4()
    id = str(id).replace('-', '')
    return id

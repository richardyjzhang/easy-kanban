package com.zhangrichard.easykanban.security;

import com.zhangrichard.easykanban.security.entity.LoginUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface LoginMapper {

    @Select("SELECT * FROM user " +
            "WHERE loginName = #{loginName} " +
            "AND deleted = 0")
    LoginUser getUserByLoginName(String loginName);
}

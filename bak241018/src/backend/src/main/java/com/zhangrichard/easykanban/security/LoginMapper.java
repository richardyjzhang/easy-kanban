package com.zhangrichard.easykanban.security;

import com.zhangrichard.easykanban.security.entity.LoginUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface LoginMapper {

    @Select("SELECT u.id, u.loginName, u.nickName, " +
            "o.id AS orgId, o.name AS orgName, " +
            "u.password, u.salt, u.sysAdmin FROM user u " +
            "LEFT JOIN organization o ON u.orgId = o.id " +
            "WHERE u.loginName = #{loginName} " +
            "AND u.deleted = 0 AND o.deleted = 0")
    LoginUser getUserByLoginName(String loginName);
}

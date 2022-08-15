package com.zhangrichard.easykanban.security;


import com.zhangrichard.easykanban.security.entity.LoginUser;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.springframework.stereotype.Component;

@Component
public class AuthUtils {

    public boolean isSysAdmin() {
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        return user.getSysAdmin();
    }

    public LoginUser currentUser() {
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        return user;
    }

}

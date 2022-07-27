package com.zhangrichard.easykanban.security.config;

import com.zhangrichard.easykanban.security.LoginMapper;
import com.zhangrichard.easykanban.security.entity.LoginUser;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import org.springframework.beans.factory.annotation.Autowired;

public class MyRealm extends AuthorizingRealm {

    @Autowired
    LoginMapper loginMapper;

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(
            PrincipalCollection principalCollection) {

        return null;
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(
            AuthenticationToken token) throws AuthenticationException {

        String principle = (String)token.getPrincipal();
        LoginUser user = loginMapper.getUserByLoginName(principle);
        if (user == null) {
            throw new AuthenticationException();
        }

        // 避免session中存入密码和盐
        String password = user.getPassword();
        String salt = user.getSalt();
        user.setPassword(null);
        user.setSalt(null);

        return new SimpleAuthenticationInfo(
                principle, password, ByteSource.Util.bytes(salt), getName()
        );
    }
}

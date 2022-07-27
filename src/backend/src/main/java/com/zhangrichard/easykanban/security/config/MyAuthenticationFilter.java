package com.zhangrichard.easykanban.security.config;

import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;

import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;

public class MyAuthenticationFilter extends FormAuthenticationFilter {

    // 未登录返回401，不要跳转到login
    @Override
    protected boolean onAccessDenied(
            ServletRequest request, ServletResponse response) {

        HttpServletResponse httpResponse = (HttpServletResponse) response;
        httpResponse.setStatus(401);

        return false;
    }
}

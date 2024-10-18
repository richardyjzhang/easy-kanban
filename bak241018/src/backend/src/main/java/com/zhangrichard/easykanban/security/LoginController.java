package com.zhangrichard.easykanban.security;

import com.zhangrichard.easykanban.security.entity.LoginResult;
import com.zhangrichard.easykanban.security.entity.LoginUser;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;

@RestController
public class LoginController {

    @Autowired
    LoginMapper loginMapper;

    @PostMapping("/login")
    public ResponseEntity<LoginResult> login(
            @RequestBody LoginUser user, HttpServletResponse response) {

        LoginResult result = new LoginResult();

        // 请求错误返回400
        if (user.getLoginName() == null || user.getPassword() == null) {
            result.setSuccess(false);
            result.setMessage("用户名或密码必填");
            return new ResponseEntity<>(result, HttpStatus.BAD_REQUEST);
        }

        // 请求正确，返回200，具体响应体有区别
        Subject subject = SecurityUtils.getSubject();
        try {
            UsernamePasswordToken token = new UsernamePasswordToken(
                    user.getLoginName(), user.getPassword());
            subject.login(token);

            result.setSuccess(true);
            result.setMessage("登录成功");
        } catch (AuthenticationException e) {
            result.setSuccess(false);
            result.setMessage("用户名或密码错误");
        }

        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/users/current")
    public ResponseEntity<LoginUser> currentUser() {
        Subject subject = SecurityUtils.getSubject();
        LoginUser loginUser = (LoginUser) subject.getPrincipal();

        LoginUser user = new LoginUser();
        user.setId(loginUser.getId());
        user.setLoginName(loginUser.getLoginName());
        user.setNickName(loginUser.getNickName());
        user.setOrgId(loginUser.getOrgId());
        user.setOrgName(loginUser.getOrgName());
        user.setSysAdmin(loginUser.getSysAdmin());

        return new ResponseEntity<>(user, HttpStatus.OK);
    }

}

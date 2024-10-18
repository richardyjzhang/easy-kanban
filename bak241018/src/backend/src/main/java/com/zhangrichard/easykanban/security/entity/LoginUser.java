package com.zhangrichard.easykanban.security.entity;

import lombok.Data;

@Data
public class LoginUser {

    private Long id;

    private String loginName;
    private String nickName;

    private Long orgId;
    private String orgName;

    private String password;
    private String salt;

    private Boolean sysAdmin;
}

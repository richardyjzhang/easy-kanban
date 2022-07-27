package com.zhangrichard.easykanban.security.entity;

import lombok.Data;

@Data
public class LoginUser {

    private Long id;
    private Long orgId;

    private String loginName;
    private String nickName;

    private String password;
    private String salt;

    private String remark;
    private Boolean sysAdmin;
}

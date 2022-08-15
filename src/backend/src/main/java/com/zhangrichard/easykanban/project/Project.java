package com.zhangrichard.easykanban.project;

import lombok.Data;

@Data
public class Project {

    private Long id;
    private String name;
    private String remark;
    private Long orgId;
    private String orgName;
}

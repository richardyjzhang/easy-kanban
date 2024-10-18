package com.zhangrichard.easykanban.worker;

import lombok.Data;

@Data
public class Worker {
    private Long id;
    private String name;
    private String remark;
    private Long orgId;
    private String orgName;
}

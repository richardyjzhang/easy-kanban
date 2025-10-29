package com.zhangrichard.easy_kanban.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    private String remark;

    public Client() {
        super();
    }

    public Client(String name, String remark) {
        this.name = name;
        this.remark = remark;
    }
}

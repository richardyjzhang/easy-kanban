package com.zhangrichard.easy_kanban.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    private String remark;

    @OneToMany(targetEntity = Project.class)
    @JoinColumn(name = "clientId", referencedColumnName = "id")
    private Set<Project> projects = new HashSet<>();

    public Client() {
        super();
    }

    public Client(String name, String remark) {
        this.name = name;
        this.remark = remark;
    }
}

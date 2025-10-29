package com.zhangrichard.easy_kanban.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    private String clientId;

    private String leaderId;

    private String statusId;

    public Project() {
        super();
    }

    public Project(String name, String clientId, String leaderId, String statusId) {
        this.name = name;
        this.clientId = clientId;
        this.leaderId = leaderId;
        this.statusId = statusId;
    }
}

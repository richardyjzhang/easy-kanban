package com.zhangrichard.easy_kanban.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class ProjectStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    public ProjectStatus() {
        super();
    }

    public ProjectStatus(String name) {
        this.name = name;
    }
}

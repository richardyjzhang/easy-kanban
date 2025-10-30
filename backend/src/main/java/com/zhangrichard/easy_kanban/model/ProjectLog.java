package com.zhangrichard.easy_kanban.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class ProjectLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String projectId;

    private String time;

    private String content;

    private String remark;
}

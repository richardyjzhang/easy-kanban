package com.zhangrichard.easy_kanban.repository;

import com.zhangrichard.easy_kanban.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, String> {

}

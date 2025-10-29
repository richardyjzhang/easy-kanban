package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Client;

import java.util.ArrayList;

public interface ClientService {
    ArrayList<Client> findAllClient();
    Client addOneClient(Client client);
    Client updateOneClient(Client client, String id);
    void deleteOneClient(String id);
}

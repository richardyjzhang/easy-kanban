package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Client;
import com.zhangrichard.easy_kanban.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class ClientServiceImpl implements ClientService {

    @Autowired
    ClientRepository ClientRepository;

    @Override
    public ArrayList<Client> findAllClient() {
        return (ArrayList<Client>) ClientRepository.findAll();
    }

    @Override
    public Client addOneClient(Client client) {
        Client newClient = ClientRepository.save(client);
        return newClient;
    }

    @Override
    public Client updateOneClient(Client client, String id) {
        client.setId(id);
        ClientRepository.save(client);
        return client;
    }

    @Override
    public void deleteOneClient(String id) {
        ClientRepository.deleteById(id);
    }
}

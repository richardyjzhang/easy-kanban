package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Client;
import com.zhangrichard.easy_kanban.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class ClientServiceImpl implements ClientService {

    @Autowired
    ClientRepository clientRepository;

    @Override
    public ArrayList<Client> findAllClient() {
        return (ArrayList<Client>) clientRepository.findAll();
    }

    @Override
    public Client addOneClient(Client client) {
        Client newClient = clientRepository.save(client);
        return newClient;
    }

    @Override
    public Client updateOneClient(Client client, String id) {
        Optional<Client> _client = clientRepository.findById(id);
        if (_client.isPresent()) {
            client.setId(id);
            clientRepository.save(client);
        }
        return client;
    }

    @Override
    public void deleteOneClient(String id) {
        clientRepository.deleteById(id);
    }
}

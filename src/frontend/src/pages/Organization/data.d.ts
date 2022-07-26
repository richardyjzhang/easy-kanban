declare namespace API {
  namespace Organization {
    type Organization = {
      id: number;
      name: string;
      remark: string | undefined;
    };

    type AddOrganization = {
      name: string;
      remark: string | undefined;
    };
  }
}

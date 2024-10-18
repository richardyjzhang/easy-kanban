declare namespace API {
  namespace Project {
    type Project = {
      id: number;
      name: string;
      remark: string | undefined;
      orgId: number;
      orgName: string | undefined;
    };

    type AddProject = {
      orgId: number;
      name: string;
      remark: string | undefined;
    };
  }
}

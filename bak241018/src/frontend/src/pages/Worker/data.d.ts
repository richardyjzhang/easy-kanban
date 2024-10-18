declare namespace API {
  namespace Worker {
    type Worker = {
      id: number;
      name: string;
      remark: string | undefined;
      orgId: number;
      orgName: string | undefined;
    };

    type AddWorker = {
      orgId: number;
      name: string;
      remark: string | undefined;
    };
  }
}

declare namespace API {
  namespace Login {
    type LoginUser = {
      loginName: string;
      password: string;
    };

    type LoginResult = {
      success: boolean;
      message: string;
    };

    type CurrentUser = {
      id: number;
      loginName: string;
      nickName: string;
      orgId: number;
      orgName: string;
    };
  }
}

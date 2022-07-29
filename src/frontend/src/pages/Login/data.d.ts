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
  }
}

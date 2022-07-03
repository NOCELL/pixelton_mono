import { BasicApiResponse } from "./types";

const ResponseErrorMethodNotFound: BasicApiResponse = {
  success: false,
  error: {
    text: "Method not found",
  },
};

const ResponseErrorBadAuth: BasicApiResponse = {
  success: false,
  error: {
    text: "Bad auth",
  },
};

const ResponseErrorBadChannelStateSignature: BasicApiResponse = {
  success: false,
  error: {
    text: "Bad channel state signature",
  },
};

const ResponseErrorBadChannelState: BasicApiResponse = {
  success: false,
  error: {
    text: "Bad channel state",
  },
};

const ResponseErrorBadChannelAddress: BasicApiResponse = {
  success: false,
  error: {
    text: "Bad channel address",
  },
};

const ResponseErrorBadValueForTopup: BasicApiResponse = {
  success: false,
  error: {
    text: "Bad value for topup",
  },
};

const ResponseErrorBadUserWallet: BasicApiResponse = {
  success: false,
  error: {
    text: "Bad user wallet",
  },
};

const ResponseErrorNoMoney: BasicApiResponse = {
  success: false,
  error: {
    text: "No money",
  },
};

const ResponseErrorNoContractDeposit: BasicApiResponse = {
  success: false,
  error: {
    text: "No contract deposit",
  },
};

const ResponseErrorNoCurrentContract: BasicApiResponse = {
  success: false,
  error: {
    text: "No contract",
  },
};

const ResponseErrorPixelParams: BasicApiResponse = {
  success: false,
  error: {
    text: "Bad pixel params",
  },
};

export {
  ResponseErrorMethodNotFound,
  ResponseErrorBadAuth,
  ResponseErrorBadValueForTopup,
  ResponseErrorBadUserWallet,
  ResponseErrorBadChannelAddress,
  ResponseErrorNoContractDeposit,
  ResponseErrorNoCurrentContract,
  ResponseErrorBadChannelState,
  ResponseErrorBadChannelStateSignature,
  ResponseErrorNoMoney,
  ResponseErrorPixelParams,
};

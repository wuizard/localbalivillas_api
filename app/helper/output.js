module.exports = {
    responseSuccess: function(res, data, extras) {
      res.status(200);
      return res.json({ status: 'Success', statusCode: 200, data: data });
    },
    responseError: function(res, {
      statusCode,
      errorCode,
      message,
      data
    }) {
      res.status(statusCode ? statusCode : 400);
      let dataResponse = {}
      if (data) {
        dataResponse = {
          data
        }
      }
      return res.json({
        status: 'Error',
        statusCode: statusCode ? statusCode : 400,
        errorCode,
        message,
        ...dataResponse
      });
    }
}
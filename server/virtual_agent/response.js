export default class ResponseHandler {
  constructor(res) {
    this.res = res;
  }

  success(data) {
    if (data) {
      return this.res.json({
        success: true,
        payload: data
      });
    }
    return this.res.json({
      success: true
    });
  }

  errorParam(data) {
    return this.res.json({
      status: data.status,
      success: false,
      error: data.error
    });
  }

  error(error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Errors : ', error.errors);
    }
    if (!error.statusCode) {
      console.error(error.stack);
    }
    return this.res.status(error.statusCode).json({
      success: false,
      errors: error.errors
    });
  }

  /**
   * Array Data
   * Data[0]: total item
   * Data[1]: Data follow page
   * */
  paging([count = 0, data = []], page = 1, limit = 10) {
    return this.res.status(200).json({
      success: true,
      totalPages: Math.ceil(count / limit),
      totalItem: count,
      page: page,
      item: data.length,
      data: data
    });
  }
}

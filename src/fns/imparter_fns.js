class imparter_fns {
  static getTxs_check_details(recipient, date) {
    if (date && !(date instanceof Date)) throw new Error("'date' must be a Date is passed in");
    if (!('address' in recipient) || !recipient.address) throw new Error("'address' required in recipient");  }

  static async getTxs_retrieve(uri, from, to, tallyOnly, tallyDollars, date, token, __fetch) {
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');
    let since = '';
    if (date) {
      since = `&since=${date.toISOString()}`;
    }
    let dollarsQuery = '';
    if (tallyDollars) {
      dollarsQuery = `&tally-dollars=true`
    }
    return await __fetch(`${uri}/get-transactions/${from}/${to}?tally-only=${tallyOnly ? 'true' : 'false'}${dollarsQuery}${since}&include-refunds=true`, {
        headers: new Headers({
          'Authorization': `Bearer ${token}`
        })
      })
      .then(res => res.json())
      .catch(e => {
        throw String(e)
      });    
  }

  static async isSignatureValid_call(uri, signature, message, from, token, __fetch) {
    return await __fetch(`${uri}/is-signature-valid`, {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        signature: btoa(signature),
        message: btoa(message),
        address: from
      })
    })
    .then((result) => {
      if (result.status == 200) {
        return true;
      } else {
        return false;
      }
    })
    .catch(e => {
      throw String(e)
    });
  }
}

export default imparter_fns;
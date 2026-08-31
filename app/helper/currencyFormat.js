module.exports = {
    currencyFormat(num) {
        let numberFormat = num * 1
        if (numberFormat >= 0) 
            return 'IDR ' + numberFormat.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        else 
            return 0
    }
}
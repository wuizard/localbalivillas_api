const moment = require("moment");
const { currencyFormat } = require("../currencyFormat");
const lbvURL = 'https://localbalivillas.com/'

module.exports = { 
    emailLBVNewBooking({
        data
    }) {
        return `<!doctype html>
        <html>
            <head>
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Local Bali Villas Order Email</title>
            <style>
            @media only screen and (max-width: 620px) {
                table[class=body] h1 {
                    font-size: 28px;
                    margin-bottom: 10px !important;
                }
                table[class=body] p,
                    table[class=body] ul,
                    table[class=body] ol,
                    table[class=body] td,
                    table[class=body] span,
                    table[class=body] a {
                    font-size: 16px !important;
                }
                table[class=body] .wrapper,
                    table[class=body] .article {
                    padding: 10px !important;
                }
                table[class=body] .content {
                    padding: 0 !important;
                }
                table[class=body] .container {
                    padding: 0 !important;
                    width: 100% !important;
                }
                table[class=body] .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                }
                table[class=body] .btn table {
                    width: 100% !important;
                }
                table[class=body] .btn a {
                    width: 100% !important;
                }
                table[class=body] .img-responsive {
                    height: auto !important;
                    max-width: 100% !important;
                    width: auto !important;
                }
            }
            @media all {
                .ExternalClass {
                    width: 100%;
                }
                .ExternalClass,
                    .ExternalClass p,
                    .ExternalClass span,
                    .ExternalClass font,
                    .ExternalClass td,
                    .ExternalClass div {
                    line-height: 100%;
                }
                .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                }
                #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                }
                .btn-primary table td:hover {
                    background-color: #34495e !important;
                }
                .btn-primary a:hover {
                    background-color: #34495e !important;
                    border-color: #34495e !important;
                }
            }
            </style>
            </head>
            <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
            <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
                <tr>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
                    <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
                        <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">
                            <!-- START MAIN CONTENT AREA -->
                            <tr>
                            <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; padding: 10px;">
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; text-align: center;">
                                    <img src="https://sstaging-localbalivilla.s3.ap-southeast-1.amazonaws.com/lbv_logo.png" style="width: 80px; height: 80px;"/>
                                    </td>
                                </tr>
                                <tr>
                                    <div style="display: flex; margin-top: 10px; margin-left: 10px; margin-right: 10px;">
                                        <div style="width: 100%;">
                                            <div style="width: 100%;">New Booking</div>
                                            <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Booking Date ${moment(data.createdDate).add(8, 'hours').format('DD MMM YYYY HH:mm')} GMT+8</span>
                                            <div style="width: 100%;"><a style="color: rgba(149, 124, 100)" href="${CONFIG.cmsURL}/order/${data._id}">${data.bookingId}</a></div>
                                        </div>
                                    </div>
                                </tr>
                                </table>
                            </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                </tr>
            </table>
            </body>
        </html>`
    },
    emailConfirmationBody({ data }) { 
        return `<!doctype html>
        <html>
            <head>
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Local Bali Villas Order Email</title>
            <style>
            @media only screen and (max-width: 620px) {
                table[class=body] h1 {
                    font-size: 28px;
                    margin-bottom: 10px !important;
                }
                table[class=body] p,
                    table[class=body] ul,
                    table[class=body] ol,
                    table[class=body] td,
                    table[class=body] span,
                    table[class=body] a {
                    font-size: 16px !important;
                }
                table[class=body] .wrapper,
                    table[class=body] .article {
                    padding: 10px !important;
                }
                table[class=body] .content {
                    padding: 0 !important;
                }
                table[class=body] .container {
                    padding: 0 !important;
                    width: 100% !important;
                }
                table[class=body] .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                }
                table[class=body] .btn table {
                    width: 100% !important;
                }
                table[class=body] .btn a {
                    width: 100% !important;
                }
                table[class=body] .img-responsive {
                    height: auto !important;
                    max-width: 100% !important;
                    width: auto !important;
                }
            }
            @media all {
                .ExternalClass {
                    width: 100%;
                }
                .ExternalClass,
                    .ExternalClass p,
                    .ExternalClass span,
                    .ExternalClass font,
                    .ExternalClass td,
                    .ExternalClass div {
                    line-height: 100%;
                }
                .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                }
                #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                }
                .btn-primary table td:hover {
                    background-color: #34495e !important;
                }
                .btn-primary a:hover {
                    background-color: #34495e !important;
                    border-color: #34495e !important;
                }
            }
            </style>
            </head>
            <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
            <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
                <tr>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
                    <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
                        <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">
                            <!-- START MAIN CONTENT AREA -->
                            <tr>
                            <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; padding: 10px;">
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; text-align: center;">
                                    <img src="https://sstaging-localbalivilla.s3.ap-southeast-1.amazonaws.com/lbv_logo.png" style="width: 80px; height: 80px;"/>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
                                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; padding-left: 10px; margin-bottom: 30px;"></p>
                                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; padding-left: 10px; margin-bottom: 5px;">Hello ${data.guestInfo.name}, your booking has been successfully confirmed!</p>
                                        <p style="font-family: sans-serif; font-size: 11px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-bottom: 5px;">Booking date: ${moment(data.createdDate).add(8,'hours').format('DD MMM YYYY HH:mm')} GMT+8</p>
                                        <p style="font-family: sans-serif; font-size: 14px; font-weight: bold; margin: 0; padding-left: 10px;">${data.propertiesInfo.propertiesName}</p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-bottom: 0px;">${moment(data.dates[0]).format('DD MMM YYYY')} - ${moment(data.dates[data.dates.length - 1]).format('DD MMM YYYY')}</p>
                                        <p style="font-family: sans-serif; font-weight: normal; margin: 0; padding-left: 10px;">
                                            <div style="display: flex; margin: 10px;">
                                                <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                    <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Check In</span> 
                                                    <span style="display: inline-block; margin-bottom: 5px; width: 100%;">${moment(data.dates[0]).format('DD MMM YYYY')}</span>
                                                    <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">15:00 WITA</span>
                                                </span>
                                                <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                    <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Total Guest</span> ${data.guestInfo.adult + data.guestInfo.kids}</span>
                                            </div>
                                            <div style="display: flex; margin: 10px;">
                                                <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                    <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Check Out</span>
                                                    <span style="display: inline-block; margin-bottom: 5px; width: 100%;">${moment(data.dates[data.dates.length - 1]).format('DD MMM YYYY')}</span>
                                                    <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">12:00 WITA</span>
                                                </span>
                                                <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                    <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Phone Number</span>${data.guestInfo.phoneNumber}</span>
                                            </div>
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: normal; margin: 0; padding: 10px; margin-right: 10px; margin-left: 10px; margin-top: 10px; border: 0.1px solid rgba(149, 124, 100, 0.3); border-radius: 10px;">
                                            <span style="font-size: 16px !important; font-weight: bold; display: inline-block; margin-bottom: 10px; width: 100%;">Booking Detail</span>
                                            <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold;">Reservation:</span> ${data.totalRooms} Rooms, ${data.dates.length - 1} Nights</span>
                                            <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold;">Room/Villa Type:</span> ${data.propertiesInfo.propertiesName}, ${data.propertiesInfo.roomName}</span>
                                            <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold;">Name of Guest:</span> ${data.guestInfo.name}</span>
                                            <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold;">Room Capacity:</span> ${data.guestInfo.adult} Adults • ${data.guestInfo.kids} Children</span>
                                            <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold;">Benefits:</span> Breakfast, Parking, Express Check-in, Free WiFi</span>
                                            <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">
                                                <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold;">Special Request:</span> ${data.specialRequest}</span>
                                        </p>
                                        <p style="margin-left: 12px;">
                                        <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold; margin-top: 10px;">Your booking has been confirmed.</span>
                                        <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">${data.totalRooms} room(s) x ${data.dates.length - 1} night(s) : ${currencyFormat(data.totalPrice)}</span>
                                        <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Total Amount: <span style="font-weight: bold">${currencyFormat(data.totalPrice)}</span></span>
                                        <span style="font-size: 10px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Includes: VAT & Service Charge</span>
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; padding-left: 10px; margin-top: 10px;"></p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: normal; margin: 0; margin-right: 10px; margin-left: 10px; margin-top: 10px; border: 0.1px solid rgba(149, 124, 100, 0.3); border-radius: 10px;"></p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: bold; margin: 0; padding-left: 10px; margin-bottom: 10px; margin-top: 15px;">
                                            Cancellation Policy
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: bold; margin: 0; margin-right: 5px; margin-left: 10px; padding-left: 5px; border-left: solid 5px red; margin-bottom: 10px;">
                                            Non-Refundable
                                            <span style="font-size: 8px !important; font-weight: normal;">
                                                <br />Since you made this reservation, the booking policy is non-refundable cannot be changed nor modified
                                            </span>
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: bold; margin: 0; margin-right: 5px; padding-left: 10px;">
                                            Important Information
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 8px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            Cancellation of this booking is non-refundable and cannot be changed nor modified. Any cancellation received on your check-in date will incur a 100% charge of the order amount. Failure to arrive on the check-in date will be considered a 'No Show' and will also incur a 100% charge of the order amount (hotel policy).
                                        </p>
                                    </td>
                                </tr>
                                </table>
                            </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                </tr>
            </table>
            </body>
        </html>`
    },
    emailLBVBody({ data }) { 
        return `<!doctype html>
        <html>
            <head>
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Local Bali Villas Information Email</title>
            <style>
            @media only screen and (max-width: 620px) {
                table[class=body] h1 {
                    font-size: 28px;
                    margin-bottom: 10px !important;
                }
                table[class=body] p,
                    table[class=body] ul,
                    table[class=body] ol,
                    table[class=body] td,
                    table[class=body] span,
                    table[class=body] a {
                    font-size: 16px !important;
                }
                table[class=body] .wrapper,
                    table[class=body] .article {
                    padding: 10px !important;
                }
                table[class=body] .content {
                    padding: 0 !important;
                }
                table[class=body] .container {
                    padding: 0 !important;
                    width: 100% !important;
                }
                table[class=body] .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                }
                table[class=body] .btn table {
                    width: 100% !important;
                }
                table[class=body] .btn a {
                    width: 100% !important;
                }
                table[class=body] .img-responsive {
                    height: auto !important;
                    max-width: 100% !important;
                    width: auto !important;
                }
            }
            @media all {
                .ExternalClass {
                    width: 100%;
                }
                .ExternalClass,
                    .ExternalClass p,
                    .ExternalClass span,
                    .ExternalClass font,
                    .ExternalClass td,
                    .ExternalClass div {
                    line-height: 100%;
                }
                .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                }
                #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                }
                .btn-primary table td:hover {
                    background-color: #34495e !important;
                }
                .btn-primary a:hover {
                    background-color: #34495e !important;
                    border-color: #34495e !important;
                }
            }
            </style>
            </head>
            <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
            <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
                <tr>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
                    <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
                        <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">
                            <!-- START MAIN CONTENT AREA -->
                            <tr>
                            <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; padding: 10px;">
                                <!-- <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; text-align: center;">
                                    <img src="https://sstaging-localbalivilla.s3.ap-southeast-1.amazonaws.com/lbv_logo.png" style="width: 80px; height: 80px;"/>
                                    </td>
                                </tr> -->
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
                                        <!-- <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; padding-left: 10px; margin-bottom: 30px;"></p> -->
                                        <p style="font-family: sans-serif; font-size: 16px; font-weight: bold; margin: 0; padding-left: 10px; margin-bottom: 10px;">New reservation confirmed! ${data.guestInfo.name} will arrive on ${moment(data.dates[0]).format('MMMM DD')}</p>
                                        <div style="display: flex; justify-content: center; margin-bottom: 10px; padding: 10px; padding-top: 0px;">
                                            <img src=${data.propertiesInfo.roomImage.length > 0 ? data.propertiesInfo.roomImage[0] : data.propertiesInfo.placeImage[0]}
                                                width="100%" height="auto" style="object-fit: contain; max-width: 580px;" />
                                        </div>
                                        <p style="font-family: sans-serif; font-size: 16px; font-weight: bold; margin: 0; padding-left: 10px;">${data.propertiesInfo.propertiesName} - ${data.propertiesInfo.roomName}</p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: normal; margin: 0; padding: 0px; margin-right: 10px; margin-left: 10px; margin-top: 10px; margin-bottom: 10px; border: 0.1px solid rgba(149, 124, 100, 0.3);"></p>
                                        <div style="display: flex; margin-left: 10px; margin-right: 10px;">
                                            <div style="width: 50%;">
                                                <div style="width: 100%; font-size: 12px !important; margin-bottom: 2px;">Check In</div>
                                                <div style="width: 100%; font-size: 14px !important; font-weight: bold;">${moment(data.dates[0]).format('ddd, DD MMM YYYY')}</div>
                                                <div style="width: 100%; font-size: 12px !important; margin-top: 2px;">15:00</div>
                                            </div>
                                            <div style="margin-left: 10px; margin-right: 10px; border: 0.1px solid rgba(149, 124, 100, 0.3);"></div>
                                            <div style="width: 50%;">
                                                <div style="width: 100%; font-size: 12px !important; margin-bottom: 2px;">Check Out</div>
                                                <div style="width: 100%; font-size: 14px !important; font-weight: bold;">${moment(data.dates[data.dates.length - 1]).format('ddd, DD MMM YYYY')}</div>
                                                <div style="width: 100%; font-size: 12px !important; margin-top: 2px;">12:00</div>
                                            </div>
                                        </div>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: normal; margin: 0; padding: 0px; margin-right: 10px; margin-left: 10px; margin-top: 10px; margin-bottom: 10px; border: 0.1px solid rgba(149, 124, 100, 0.3);"></p>
                                        <div style="display: flex; margin-left: 10px; margin-right: 10px;">
                                            <div style="width: 100%;">
                                                <div style="width: 100%;">Booking Confirmation ID</div>
                                                <div style="width: 100%;"><a style="color: rgba(149, 124, 100)" href="${CONFIG.cmsURL}/order/${data._id}">${data.bookingId}</a></div>
                                                <div style="width: 100%; font-size: 10px;">Booking Date: ${moment(data.createdDate).format('DD MMM YYYY')}</div>
                                            </div>
                                        </div>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: normal; margin: 0; margin-right: 10px; margin-left: 10px; margin-top: 10px; border: 0.1px solid rgba(149, 124, 100, 0.3); border-radius: 10px;"></p>
                                        <p style="margin-left: 12px;">
                                        <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%; font-weight: bold;">Guest paid</span>
                                        <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">${data.totalRooms} room(s) x ${data.dates.length - 1} night(s) : ${currencyFormat(data.totalPrice)}</span>
                                        <span style="font-size: 12px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Total Amount: <span style="font-weight: bold">${currencyFormat(data.totalPrice)}</span></span>
                                        <span style="font-size: 10px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Includes: VAT & Service Charge</span>
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; padding-left: 10px; margin-top: 10px;"></p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: normal; margin: 0; margin-right: 10px; margin-left: 10px; margin-top: 10px; border: 0.1px solid rgba(149, 124, 100, 0.3); border-radius: 10px;"></p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: bold; margin: 0; padding-left: 10px; margin-bottom: 10px; margin-top: 15px;">
                                            Cancellation Policy
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: bold; margin: 0; margin-right: 5px; margin-left: 10px; padding-left: 5px; border-left: solid 5px red; margin-bottom: 10px;">
                                            Non-Refundable
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 10px !important; font-weight: bold; margin: 0; margin-right: 5px; padding-left: 10px;">
                                            Important Information
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 8px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            Cancellation of this booking is non-refundable and cannot be changed nor modified. Any cancellation received on your check-in date will incur a 100% charge of the order amount. Failure to arrive on the check-in date will be considered a 'No Show' and will also incur a 100% charge of the order amount (hotel policy).
                                        </p>
                                    </td>
                                </tr>
                                </table>
                            </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                </tr>
            </table>
            </body>
        </html>`
    },
    emailLBVRefund({ data }) {
        return `<!doctype html>
        <html>
            <head>
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Local Bali Villas Information Email</title>
            <style>
            @media only screen and (max-width: 620px) {
                table[class=body] h1 {
                    font-size: 28px;
                    margin-bottom: 10px !important;
                }
                table[class=body] p,
                    table[class=body] ul,
                    table[class=body] ol,
                    table[class=body] td,
                    table[class=body] span,
                    table[class=body] a {
                    font-size: 16px !important;
                }
                table[class=body] .wrapper,
                    table[class=body] .article {
                    padding: 10px !important;
                }
                table[class=body] .content {
                    padding: 0 !important;
                }
                table[class=body] .container {
                    padding: 0 !important;
                    width: 100% !important;
                }
                table[class=body] .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                }
                table[class=body] .btn table {
                    width: 100% !important;
                }
                table[class=body] .btn a {
                    width: 100% !important;
                }
                table[class=body] .img-responsive {
                    height: auto !important;
                    max-width: 100% !important;
                    width: auto !important;
                }
            }
            @media all {
                .ExternalClass {
                    width: 100%;
                }
                .ExternalClass,
                    .ExternalClass p,
                    .ExternalClass span,
                    .ExternalClass font,
                    .ExternalClass td,
                    .ExternalClass div {
                    line-height: 100%;
                }
                .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                }
                #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                }
                .btn-primary table td:hover {
                    background-color: #34495e !important;
                }
                .btn-primary a:hover {
                    background-color: #34495e !important;
                    border-color: #34495e !important;
                }
            }
            </style>
            </head>
            <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
            <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
                <tr>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
                    <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
                        <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">
                            <!-- START MAIN CONTENT AREA -->
                            <tr>
                            <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; padding: 10px;">
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; text-align: left; padding-left: 10px;">
                                    <img src="https://sstaging-localbalivilla.s3.ap-southeast-1.amazonaws.com/lbv_logo.png" style="width: 60px; height: 60px;"/>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
                                        <!-- <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; padding-left: 10px; margin-bottom: 30px;"></p> -->
                                        <p style="font-family: sans-serif; font-size: 16px; font-weight: bold; margin: 0; padding-left: 10px; margin-bottom: 10px;">Your reservation has been canceled</p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            Hi ${data.guestInfo.name}
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            We hope this message finds you well. The reservation with ${data.guestInfo.name} has been canceled in our system due to the unavailability of the booking you made.
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            We understand this is inconvenient, so we have issued a full refund of ${currencyFormat(data.totalPrice)}. While this refund is immediate on our part, it may take up to 5-14 business days for the refund transaction to reflect in your account.
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            We apologize once again for the disruption to your travel plans.
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            Thank you for your understanding.
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 20px;">
                                            <a style="color: rgba(149, 124, 100)" href="${lbvURL}">Search for a new place</a>
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 5px;">
                                            Best Regards,
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            Local Bali Villas
                                        </p>
                                        <p style="margin-left: 12px;">
                                    </td>
                                </tr>
                                </table>
                            </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                </tr>
            </table>
            </body>
        </html>`
    },
    emailLBVCheckOut({ data }) {
        return `<!doctype html>
        <html>
            <head>
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Local Bali Villas Information Email</title>
            <style>
            @media only screen and (max-width: 620px) {
                table[class=body] h1 {
                    font-size: 28px;
                    margin-bottom: 10px !important;
                }
                table[class=body] p,
                    table[class=body] ul,
                    table[class=body] ol,
                    table[class=body] td,
                    table[class=body] span,
                    table[class=body] a {
                    font-size: 16px !important;
                }
                table[class=body] .wrapper,
                    table[class=body] .article {
                    padding: 10px !important;
                }
                table[class=body] .content {
                    padding: 0 !important;
                }
                table[class=body] .container {
                    padding: 0 !important;
                    width: 100% !important;
                }
                table[class=body] .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                }
                table[class=body] .btn table {
                    width: 100% !important;
                }
                table[class=body] .btn a {
                    width: 100% !important;
                }
                table[class=body] .img-responsive {
                    height: auto !important;
                    max-width: 100% !important;
                    width: auto !important;
                }
            }
            @media all {
                .ExternalClass {
                    width: 100%;
                }
                .ExternalClass,
                    .ExternalClass p,
                    .ExternalClass span,
                    .ExternalClass font,
                    .ExternalClass td,
                    .ExternalClass div {
                    line-height: 100%;
                }
                .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                }
                #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                }
                .btn-primary table td:hover {
                    background-color: #34495e !important;
                }
                .btn-primary a:hover {
                    background-color: #34495e !important;
                    border-color: #34495e !important;
                }
            }
            </style>
            </head>
            <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
            <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
                <tr>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
                    <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
                        <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">
                            <!-- START MAIN CONTENT AREA -->
                            <tr>
                            <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; padding: 10px;">
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; text-align: left; padding-left: 10px;">
                                    <img src="https://sstaging-localbalivilla.s3.ap-southeast-1.amazonaws.com/lbv_logo.png" style="width: 60px; height: 60px;"/>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
                                        <!-- <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; padding-left: 10px; margin-bottom: 30px;"></p> -->
                                        <!-- <p style="font-family: sans-serif; font-size: 16px; font-weight: bold; margin: 0; padding-left: 10px; margin-bottom: 10px;">Your reservation has been canceled</p> -->
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px; margin-top: 10px;">
                                            Dear ${data.guestInfo.name},
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            We hope you had a wonderful stay with us at ${data.propertiesInfo.propertiesName}. It was our pleasure to host you, and we would love to hear about your experience.
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            If you have a moment, please consider leaving a review to share your feedback. Your input helps us improve our services and ensures future guests have an excellent experience as well.
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            Thank you again for choosing to stay with us, and we hope to welcome you back in the future!
                                        </p>
                                        <p style="margin-left: 12px;">
                                        <button style="background: rgba(149, 124, 100); border: 0px; border-radius: 4px; padding: 10px; font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-top: 10px; margin-bottom: 10px;">
                                            <a style="color: white" href="${lbvURL}/${data.propertiesInfo.properties.type}/${data.propertiesInfo.properties.key}">Write a review</a>
                                        </button>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 5px; margin-top: 20px;">
                                            Best Regards,
                                        </p>
                                        <p style="font-family: sans-serif; font-size: 12px !important; font-weight: normal; margin: 0; padding-left: 10px; margin-right: 5px; margin-bottom: 10px;">
                                            Local Bali Villas
                                        </p>
                                    </td>
                                </tr>
                                </table>
                            </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                </tr>
            </table>
            </body>
        </html>`
    },
    emailCustRating({ data }) {
        return ``
    },
    emailRemindCheckIn({ data }) {
        return `<!doctype html>
        <html>
            <head>
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Local Bali Villas Order Email</title>
            <style>
            @media only screen and (max-width: 620px) {
                table[class=body] h1 {
                    font-size: 28px;
                    margin-bottom: 10px !important;
                }
                table[class=body] p,
                    table[class=body] ul,
                    table[class=body] ol,
                    table[class=body] td,
                    table[class=body] span,
                    table[class=body] a {
                    font-size: 16px !important;
                }
                table[class=body] .wrapper,
                    table[class=body] .article {
                    padding: 10px !important;
                }
                table[class=body] .content {
                    padding: 0 !important;
                }
                table[class=body] .container {
                    padding: 0 !important;
                    width: 100% !important;
                }
                table[class=body] .main {
                    border-left-width: 0 !important;
                    border-radius: 0 !important;
                    border-right-width: 0 !important;
                }
                table[class=body] .btn table {
                    width: 100% !important;
                }
                table[class=body] .btn a {
                    width: 100% !important;
                }
                table[class=body] .img-responsive {
                    height: auto !important;
                    max-width: 100% !important;
                    width: auto !important;
                }
            }
            @media all {
                .ExternalClass {
                    width: 100%;
                }
                .ExternalClass,
                    .ExternalClass p,
                    .ExternalClass span,
                    .ExternalClass font,
                    .ExternalClass td,
                    .ExternalClass div {
                    line-height: 100%;
                }
                .apple-link a {
                    color: inherit !important;
                    font-family: inherit !important;
                    font-size: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                    text-decoration: none !important;
                }
                #MessageViewBody a {
                    color: inherit;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                }
                .btn-primary table td:hover {
                    background-color: #34495e !important;
                }
                .btn-primary a:hover {
                    background-color: #34495e !important;
                    border-color: #34495e !important;
                }
            }
            </style>
            </head>
            <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
            <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
                <tr>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
                    <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
                        <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; border-radius: 3px;">
                            <!-- START MAIN CONTENT AREA -->
                            <tr>
                            <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; padding: 10px;">
                                <tr>
                                    <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; text-align: center;">
                                        <img src="https://sstaging-localbalivilla.s3.ap-southeast-1.amazonaws.com/lbv_logo.png" style="width: 80px; height: 80px;"/>
                                    </td>
                                    <div style="width: 100%;">Guest Arrive at ${data[0].dates[0]}</div>
                                </tr>
                                ${data.map( value => {
                                    return `<tr>
                                        <div style="display: flex; margin-top: 10px; margin-left: 10px; margin-right: 10px;">
                                            <div style="width: 100%;">
                                                <div style="width: 100%;"><a style="color: rgba(149, 124, 100)" href="${CONFIG.cmsURL}/order/${value._id}">${value.bookingId}</a></div>
                                                <span style="font-size: 11px !important; display: inline-block; margin-bottom: 5px; width: 100%;">Arrival Time : ${value.arrivalTime}</span>
                                            </div>
                                        </div>
                                    </tr>`
                                })}
                                </table>
                            </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
                </tr>
            </table>
            </body>
        </html>`
    }
}
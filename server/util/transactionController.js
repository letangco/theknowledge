import {addTransaction, updateTransaction} from '../controllers/transaction.controller';
import {addTransactionDetail} from '../controllers/transactionDetail.controller';
import {changeUserSupportState, serverSocketStaticInstance,
  removeCallTransactionInstance, removeChatTransactionInstance}
  from '../routes/socket_routes/chat_socket';
import {addChatGroupByUsers} from '../controllers/chatGroup.controller';
import {addMessage} from '../controllers/message.controller';
import {addMoney} from '../controllers/user.controller';
import {getSimpleUserInfoByIdWithBalance} from '../controllers/user.controller';
import serverConfig from '../config';
import globalConstants from '../../config/globalConstants';

const minDuration = 5; // second
/*
1. When user Accept call => Store userSend and userReceive, add counter for connection connected
2. When user loaded video frame => If the connection enough => set begin time for this transaction
Init transaction in database
3. When transaction finished => Calculate all money statement and Update this transaction money info
// Todo: write clear document how to use this class
 */
export default class TransactionController {
  constructor(_id) {
    this.id = _id;
    this.callTime = 0;
    this.stoped = false;
  }
  /**
   * Add a transaction to database
   * When the transaction established, add the transaction to store it
   */
  initData() {
    // console.log('TC initData');
    getSimpleUserInfoByIdWithBalance(this.sharers).then((userInfo) => {
      this.isExpert = userInfo.expert == 1; // Use to know user call to is expert or not
      // console.log('TC initData userInfo:', userInfo);
      if(userInfo.cuid) {
        // Get correct price of call type
        const price = this.type==='chat'?userInfo.priceChat:(this.type==='call'?userInfo.priceCall:0);
        this.price = price||0; // Is zero if not set
        // Begin time counter to calc money spend
        this.initMoneyManage();
        addTransaction({
          sharers: this.sharers,
          type: this.type,
          price: this.price,
          currency: this.currency,
          beginTime: this.beginTime
        }).then((transactionAdded)=>{
          // console.log('TC addTransaction done');
          // console.log(transactionAdded);

          this.initDataDone = true;
          this.cuid = transactionAdded.cuid;
        });
      } else {
        console.log('TC initData, error:', userInfo);
      }
    });
  }

  /**
   * When the transaction ended, update it information
   * todo: delete this instance when transaction saved
   */
  storeData(isOutOfMoney, isLostConnect) {
    // console.log('TC storeData');
    // console.log('TC isOutOfMoney', isOutOfMoney);
    // console.log('TC isLostConnect', isLostConnect);
    if(!this.initDataDone) {
      console.log('TC ERROR: the transaction not yet init');
      return;
    }
    // If have request save again while the transaction stored, ignore it
    if(this.storedData === true) {
      console.log('TC ERROR: the transaction saved');
      return;
    }
    this.storedData = true;
    // console.log('TC this.initDataDone:', this.initDataDone);
    // Todo: when the transaction done, delete it self
    this.endTime = Date.now();
    // Get call duration in minute
    this.callDuration = parseInt(((this.endTime - this.beginTime)/1000).toFixed(0)) || 0;
    this.updateTransaction().then((result)=>{
      if(result===true) {
        this.addTransactionMessage();
        this.addTransactionDetail();
        // If the transaction end by have user lost connection to server
        if(isLostConnect) {
          // console.log('TC NOTICE: the transaction end because lost connect');
          serverSocketStaticInstance.emitToUserExclude(userSend, this.socketID, 'TransactionDisconnect');
          serverSocketStaticInstance.emitToUserExclude(userReceive, this.socketID, 'TransactionDisconnect');
        }
      } else {
        // Todo: the transaction save failed
        // console.log('TC ERROR: the transaction save failed');
        // console.log(result);
        this.storedData = false;
      }
    });
    let userSend = this.userLearn;
    let userReceive = this.sharers;
    // If stop the transaction by out of money
    // => The transaction ended => State of user then is READY
    if(isOutOfMoney) {
      // console.log('isOutOfMoney when storeData');
    }
    // if(isOutOfMoney) {

      changeUserSupportState(userSend, globalConstants.userState.READY);
      changeUserSupportState(userReceive, globalConstants.userState.READY);
    // }
    this.stopTimer();
    this.stoped = true;
    // Remove transaction instance
    if(this.type === 'chat') {
      removeChatTransactionInstance(this.id);
    }
    if(this.type === 'call') {
      removeCallTransactionInstance(this.id);
    }
    return this.callDuration;
  }

  /**
   * Update transaction with full info about money
   * @returns {Promise}
   */
  updateTransaction() {
    // console.log('TC updateTransaction');
    return new Promise( resolve => {
      // Call duration in minute
      const callDuration = this.callDuration;
      // Calculate money with out tax
      const total = ((callDuration / 60) * this.price).toFixed(2);

      const taxLevel = serverConfig.taxLevel;
      const feesLevel = serverConfig.feesLevel;
      const tax = (taxLevel * total).toFixed(2);
      const fees = (feesLevel * total).toFixed(2);
      const sharersFunds = (total - tax - fees).toFixed(2);

      this.total = total;
      this.tax = tax;
      this.fees = fees;
      this.sharersFunds = sharersFunds;

      updateTransaction(this.cuid, {
        endTime: this.endTime,
        moneyEarnings: total,
        tax: tax,
        fees: fees,
        sharersFunds: sharersFunds,
        duration: callDuration}).then((result)=>{
        resolve(result);
      });
    });
  }

  /**
   * Add transaction detail for each learner
   */
  addTransactionDetail() {
    // console.log('TC addTransactionDetail');
    // add to transactionDetail.
    var transactionDetail = {
      transactionID: this.cuid,
      sharers: this.sharers,
      learnerID: this.userLearn,
      fees: this.total,
      duration: this.callDuration
    };
    Promise.resolve(addTransactionDetail(transactionDetail)).then(()=>{
      // Add money for Expert
      addMoney(this.sharers, this.sharersFunds);
    });
  }

  /**
   * Add message details of this transaction
   */
  addTransactionMessage() {
    // console.log('TC addTransactionMessage');
    // Add message transaction info to all users of this transaction
    // Get chat group data
    let userSend = this.userLearn;
    let userReceive = this.sharers;
    addChatGroupByUsers([userSend, userReceive]).then((newChatGroup) => {
      // If add success
      if (newChatGroup.cuid) {
        let chatGroupID = newChatGroup.cuid;
        // Add message for caller
        addMessage({
          chatGroup: chatGroupID,
          type: this.type,
          userSend: userSend,
          content: {
            type: 'paid',
            total: this.total, // $
            price: this.price, // $/min
            callDuration: this.callDuration // sec
          }
        }).then((messageAdded) => {
          serverSocketStaticInstance.emitToUser(userSend, 'UpdateMessageList', messageAdded);
          // Ensure the sender and receiver are difference
          // In case send the call message, the user send and receive are same
          if (userReceive !== userSend) {
            // Send to rest part of user's sockets
            serverSocketStaticInstance.emitToUserExclude(userReceive, this.socketID, 'UpdateMessageList', messageAdded);
          }
        });
        // Add message for Expert
        addMessage({
          chatGroup: chatGroupID,
          type: this.type,
          userSend: userReceive,
          content: {
            type: 'earned',
            total: this.total, // $
            price: this.price, // $/min
            callDuration: this.callDuration // sec
          }
        }).then((messageAdded) => {
          serverSocketStaticInstance.emitToUser(userReceive, 'UpdateMessageList', messageAdded);
          // Ensure the sender and receiver are difference
          // In case send the call message, the user send and receive are same
          if (userReceive !== userSend) {
            // Send to rest part of user's sockets
            serverSocketStaticInstance.emitToUserExclude(userSend, this.socketID, 'UpdateMessageList', messageAdded);
          }
        });
      }
    });
  }

  initMoneyManage() {
    // console.log('TC initMoneyManage');
    getSimpleUserInfoByIdWithBalance(this.userLearn).then((userInfo)=>{
      // console.log('TC initMoneyManage userInfo:', userInfo);
      // If user receive set price is 0 or not set(mean 0 too)
      let expertPrice = this.price||0;
      // console.log('TC initMoneyManage, expertPrice:', expertPrice);
      // If expert price is zero or not set, then user call can call/chat free
      // So no need to begin timer to check when user call out of money
      if(expertPrice > 0) {
        let userBalance = userInfo.balance||0;
        // console.log('TC initMoneyManage, userBalance:', userBalance);
        // The time user learn can call/chat before they out of money
        // Keep 10 sec for ensure the balance cannot be negative
        this.callDurationable = ((userBalance/expertPrice)*60) - minDuration;
        // console.log('TC callDurationable:', this.callDurationable);
        this.beginTimer();
      }
    });
  }

  timerStep = () => {
    this.callTime++;
    // console.log('TC timerStep this.callTime:',this.callTime);
    if(this.callTime >= this.callDurationable) {
      this.storeData(true);
      let userSend = this.userLearn;
      let userReceive = this.sharers;
      serverSocketStaticInstance.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
        type: globalConstants.socketActionTypes.RESPONSE_OUT_OF_MONEY
      });
      // Ensure the sender and receiver are difference
      if (userSend !== userReceive) {
        // Send to rest part of user's sockets
        serverSocketStaticInstance.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, {
          type: globalConstants.socketActionTypes.RESPONSE_OUT_OF_MONEY
        });
      }
    }
  };

  beginTimer() {
    // console.log('TC beginTimer');
    this.timer = setInterval(this.timerStep, 1000);
  }

  stopTimer() {
    // console.log('TC stopTimer');
    if(this.timer) {
      clearInterval(this.timer);
    }
  }
}

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import commafy from 'commafy'
import toastr from 'toastr'
import Tooltip from '../Tooltip'
import store from '../../store'
import registry from '../../services/registry'
import PubSub from 'pubsub-js'

import './WithdrawVotingRightsContainer.css'

class WithdrawVotingRightsContainer extends Component {
  constructor (props) {
    super()

    this.state = {
      account: props.account,
      availableTokens: null,
      lockedTokens: null
    }

    this.onWithdraw = this.onWithdraw.bind(this)
  }

  componentDidMount () {
    this._isMounted = true
    this.getAvailableTokensToWithdraw()

    store.subscribe(x => {
      this.getAvailableTokensToWithdraw()
    })
  }

  componentWillUnmount () {
    this._isMounted = false
  }

  render () {
    const {
      availableTokens
    } = this.state

    return (

      <div className='column five wide t-center'>
            Unlocked Voting ADT <Tooltip class='InfoIconHigh' info='These voting tokens are not used in polls and are eligible to be withdrawn from the registry and returned to your wallet.' />
        <div className='column sixteen wide UnlockedAdt'>
          <span className='VotingTokensAmount'>
            {availableTokens !== null ? commafy(availableTokens) + ' ADT' : '-'}
          </span>
          <div>
            <button
              onClick={this.onWithdraw}
              className='ui button green tiny'>
                WITHDRAW
            </button>
          </div>
        </div>
      </div>
    )
  }

  async getAvailableTokensToWithdraw () {
    const {account} = this.state

    if (!account) {
      return false
    }

    try {
      const availableTokens = await registry.getAvailableTokensToWithdraw()
      const lockedTokens = (await registry.getLockedTokens()).toNumber()
      if (this._isMounted) {
        this.setState({
          availableTokens,
          lockedTokens
        })
      }
    } catch (error) {
      console.error('Get Available Tokens to Withdraw Error: ', error)
      toastr.error('There was an error fetching the number of available tokens to withdraw. Please make sure you are signed in to MetaMask.')
    }
  }

  onWithdraw (event) {
    event.preventDefault()

    this.withdrawTokens()
  }

  async withdrawTokens () {
    const {availableTokens} = this.state
    if (commafy(availableTokens) === '0') {
      toastr.error('You do not have any available ADT to withdraw')
      return false
    }
    try {
      let transactionInfo = {
        src: 'withdraw_voting_ADT',
        title: 'Withdraw Voting ADT'
      }
      PubSub.publish('TransactionProgressModal.open', transactionInfo)
      console.log('available tokens: ', availableTokens)
      await registry.withdrawVotingRights(availableTokens)
    } catch (error) {
      console.error('Withdraw Tokens Error: ', error)
      PubSub.publish('TransactionProgressModal.error')
    }
  }
}

WithdrawVotingRightsContainer.propTypes = {
  account: PropTypes.string
}

export default WithdrawVotingRightsContainer
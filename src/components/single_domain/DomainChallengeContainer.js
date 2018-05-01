import React, { Component } from 'react'
import PropTypes from 'prop-types'
import commafy from 'commafy'
import toastr from 'toastr'
import moment from 'moment'
import { Button } from 'semantic-ui-react'
import Tooltip from '../Tooltip'
import calculateGas from '../../utils/calculateGas'

import Countdown from '../CountdownText'
import registry from '../../services/registry'
import parametizer from '../../services/parameterizer'
import PubSub from 'pubsub-js'
import Eth from 'ethjs'
import IndividualGuideModal from './IndividualGuideModal'

import './DomainChallengeContainer.css'

const big = (number) => new Eth.BN(number.toString(10))
const tenToTheNinth = big(10).pow(big(9))

class DomainChallengeContainer extends Component {
  constructor (props) {
    super(props)
    let displayChallengeModal = JSON.parse(window.localStorage.getItem('ChallengeGuide'))
    const { domainData, domain } = props
    this.state = {
      domain,
      applicationExpiry: null,
      minDeposit: null,
      currentDeposit: null,
      source: props.source,
      dispensationPct: null,
      displayChallengeModal: !displayChallengeModal,
      domainData
    }

    this.getDispensationPct = this.getDispensationPct.bind(this)
  }

  async componentDidMount() {
    this._isMounted = true
    
    await this.getMinDeposit()
    await this.getDispensationPct()
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  componentWillReceiveProps(next) {
    console.log("2: ", next.domainData, this.props)
    if(this.domainData){
      this.setState({
        domainData: next.domainData,
        applicationExpiry: next.domainData.applicationExpiry,
        currentDeposit: big(next.domainData.currentDeposit).div(tenToTheNinth)
      })
    }
  }

  render() {
    const {
      applicationExpiry,
      minDeposit,
      source,
      dispensationPct,
      currentDeposit,
      displayChallengeModal
    } = this.state

    const stageEndMoment = applicationExpiry ? moment.unix(applicationExpiry) : null
    const stageEnd = stageEndMoment ? stageEndMoment.format('YYYY-MM-DD HH:mm:ss') : '-'
    const stakedDifference = currentDeposit - minDeposit
    let redirectState = this.props.redirectState ? this.props.redirectState.cameFromRedirect : false

    return (
      <div className='DomainChallengeContainer'>
        <div className='ui grid stackable'>
          {
            (source === 'InRegistry') ? null
              : <div className='column sixteen wide HeaderColumn'>
                <div className='row HeaderRow'>
                  <div className='ui large header'>
                    Stage: In Application
                    <Tooltip
                      info='The first phase of the voting process is the commit phase where the ADT holder stakes a hidden amount of votes to SUPPORT or OPPOSE the domain application. The second phase is the reveal phase where the ADT holder reveals the staked amount of votes to either the SUPPORT or OPPOSE side.'
                    />
                  </div>
                </div>
                <div className='ui divider' />
              </div>
          }

          {
            (source === 'InRegistry') ? null
              : <div className='column sixteen wide center aligned'>
                <div>
                  <p>Challenge stage ends</p>
                  <p><strong>{stageEnd}</strong></p>
                  <div>Remaining time: <Countdown
                    endDate={stageEndMoment}
                    onExpire={this.onCountdownExpire.bind(this)} /></div>
                </div>
              </div>
          }
          <div className='column sixteen wide center aligned ChallengeInfoContainer'>
            <div>
              <div>
                <p>ADT Required to Challenge</p>
                <span className='RequiredADT'>
                  <strong>{minDeposit ? commafy(minDeposit) : '-'} ADT</strong>
                </span>
                {
                  (source === 'InRegistry') ? null
                    : <div className='NumberCircle'>1</div>
                }
              </div>
              {
                (stakedDifference < 0)
                  ? <div className='TouchRemoveMessage'>
                    <p>Challenging this domain will remove it from the registry since the listing has less ADT staked than required.</p>
                  </div>
                  : <div className='PayoutPercentageContainer'>
                    <p>Your Percentage Payout if Successful: </p><span className='PayoutPercentage'><strong>{dispensationPct}%</strong></span>
                  </div>
              }
            </div>
            <Button basic className='ChallengeButton' onClick={this.onChallenge.bind(this)}>Challenge</Button>
          </div>
        </div>
        {
          source === 'InRegistry'
            ? null
            : redirectState
              ? null
              : <IndividualGuideModal steps={'ChallengeGuide'} open={displayChallengeModal} />
        }
      </div>
    )
  }

  async getMinDeposit() {
    if (this._isMounted) {
      this.setState({
        minDeposit: (await registry.getMinDeposit()).toNumber()
      })
    }
  }


  onChallenge(event) {
    event.preventDefault()

    this.challenge()
  }

  async challenge() {
    const { domain, minDeposit } = this.state

    let inApplication = null

    try {
      inApplication = await registry.applicationExists(this.state.domainData.listingHash)
    } catch (error) {
      toastr.error('Error')
    }

    if (inApplication) {
      try {
        let data = {
          domain: domain,
          stake: minDeposit,
          action: 'challenge'
        }
        PubSub.publish('RedditConfirmationModal.show', data)
        try {
          calculateGas({
            domain: domain,
            contract_event: true,
            event: 'challenge',
            contract: 'registry',
            event_success: true
          })
        } catch (error) {
          console.log('error reporting gas')
        }

        // TODO: better way of resetting state
        // setTimeout(() => {
        //   window.location.reload()
        // }, 2e3)
      } catch (error) {
        toastr.error('Error')
        try {
          calculateGas({
            domain: domain,
            contract_event: true,
            event: 'challenge',
            contract: 'registry',
            event_success: false
          })
        } catch (error) {
          console.log('error reporting gas')
        }
      }
    } else {
      toastr.error('Domain not in application')
    }
  }

  onCountdownExpire() {
    // allow some time for new block to get mined and reload page
    setTimeout(() => {
      window.location.reload()
    }, 15000)
  }

  async getDispensationPct() {
    try {
      parametizer.get('dispensationPct')
        .then((response) => {
          let result = response.toNumber()
          this.setState({
            dispensationPct: result
          })
        })
    } catch (error) {
      console.error(error)
    }
  }
}

DomainChallengeContainer.propTypes = {
  domain: PropTypes.string
}

export default DomainChallengeContainer

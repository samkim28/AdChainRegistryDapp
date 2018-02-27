import React, { Component } from 'react'
import commafy from 'commafy'
import toastr from 'toastr'
import moment from 'moment'
import { Popup, Button, Segment } from 'semantic-ui-react'
// import { soliditySHA3 } from 'ethereumjs-abi'

import Countdown from './CountdownText'
import ParameterizerService from '../services/parameterizer'
import DomainChallengeInProgressContainer from './DomainChallengeInProgressContainer'

import './DomainChallengeContainer.css'

class GovernanceChallengeContainer extends Component {
  constructor (props) {
    super()

    this.state = {
      domain: props.domain,
      applicationExpiry: null,
      minDeposit: null,
      currentDeposit: null,
      inProgress: false,
      source: props.source
    }

    this.updateStatus = this.updateStatus.bind(this)
  }

  componentDidMount () {
    this._isMounted = true
  }

  componentWillUnmount () {
    this._isMounted = false
  }

  render () {
    if (!this.props) return false
    const {
      applicationExpiry,
      minDeposit,
      inProgress,
      source
      // parameterName,
      // parameterValue
    } = this.props

    const stageEndMoment = applicationExpiry ? moment.unix(applicationExpiry) : null
    const stageEnd = stageEndMoment ? stageEndMoment.format('YYYY-MM-DD HH:mm:ss') : '-'

    return (
      <div className='DomainChallengeContainer'>
        <div className='ui grid stackable pd-20'>
          {
            (source === 'InRegistry') ? null
            : <div className='column sixteen wide HeaderColumn'>
              <div className='row HeaderRow'>
                <div className='ui large header'>
                  Stage: In Application
                  <Popup
                    trigger={<i className='icon info circle' />}
                    content='The first phase of the voting process is the commit phase where the ADT holder stakes a hidden amount of votes to SUPPORT or OPPOSE the domain application. The second phase is the reveal phase where the ADT holder reveals the staked amount of votes to either the SUPPORT or OPPOSE side.'
                    />
                </div>
                <Button
                  basic
                  className='right refresh'
                  onClick={this.updateStatus}
                  >
                  Refresh Status
                </Button>
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
          <div className='column sixteen wide center aligned'>
            <Segment.Group>
              <Segment className='SegmentOne'>
                <p>
                  You should challenge cbs.com’s application if you don’t believe it should be in the adChain Registry. Clicking the “CHALLENGE” button below will initiate cbs.com’s Voting stage.
                </p>
              </Segment>
              <Segment className='SegmentTwo'>
                {
                  (source === 'InRegistry') ? null
                  : <div className='NumberCircle'>1</div>
                }
                <p>
                  ADT required to challenge: <strong>{minDeposit ? commafy(minDeposit) : '-'} ADT</strong>
                  <br />
                Your percentage payout if your challenge is successful: <strong>50%</strong>
                </p>
              </Segment>
              <Segment className='SegmentThree'>
                <p>
                  If your challenge is successful once the Reveal stage ends, you will have your ADT reimbursed and be awarded the payout.
                </p>
              </Segment>
              <Segment className='SegmentFour'>
                <Button basic className='ChallengeButton' onClick={this.onChallenge.bind(this)}>Challenge</Button>
              </Segment>
            </Segment.Group>
          </div>
        </div>
        {inProgress ? <DomainChallengeInProgressContainer /> : null}
      </div>
    )
  }

  onChallenge (event) {
    event.preventDefault()

    this.challenge()
  }

  async updateStatus (name, value) {
    try {
      await ParameterizerService.processProposal(name, value)
    } catch (error) {
      toastr.error('There was an error updating domain status')
      console.error(error)
    }
  }

  async challenge (name, value) {
    // let result
    let propExists = null
    try {
      propExists = await ParameterizerService.propExists(name, value)
    } catch (error) {
      toastr.error('Error')
    }

    if (propExists) {
      if (this._isMounted) {
        this.setState({
          inProgress: true
        })
      }

      try {
        await ParameterizerService.challengeReparameterization()
        toastr.success('Successfully challenged parameter')

        if (this._isMounted) {
          this.setState({
            inProgress: false
          })
        }

        // TODO: better way of resetting state
        setTimeout(() => {
          window.location.reload()
        }, 2e3)
      } catch (error) {
        toastr.error('Error')
        if (this._isMounted) {
          this.setState({
            inProgress: false
          })
        }
      }
    } else {
      toastr.error('Proposal not in application')
    }
  }

  onCountdownExpire () {
    // allow some time for new block to get mined and reload page
    setTimeout(() => {
      window.location.reload()
    }, 15000)
  }
}

export default GovernanceChallengeContainer

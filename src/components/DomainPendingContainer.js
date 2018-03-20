import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'semantic-ui-react'
import Tooltip from './Tooltip'
import './DomainPendingContainer.css'
import registry from '../services/registry'
import toastr from 'toastr'
import RefreshInProgressContainer from './RefreshInProgressContainer'
import PubSub from 'pubsub-js'

class DomainPendingContainer extends Component {
  constructor (props) {
    super()

    this.state = {
      domain: props.domain,
      inProgress: false
    }
  }

  render () {
    const {
      domain,
      inProgress
    } = this.state

    return (
      <div className='DomainPendingContainer'>
        <div className='ui grid stackable DomainPendingBody'>
          <div className='column sixteen wide HeaderColumn'>
            <div className='row HeaderRow'>
              <div className='ui large header'>
                Stage: Pending
                <Tooltip
                  info='The first phase of the voting process is the commit phase where the ADT holder stakes a hidden amount of votes to SUPPORT or OPPOSE the domain application. The second phase is the reveal phase where the ADT holder reveals the staked amount of votes to either the SUPPORT or OPPOSE side.'
                />
              </div>
              <Button
                basic
                className='right refresh'
                onClick={() => this.updateStatus(domain)}
              >
                Refresh Status
              </Button>
            </div>
            <div className='ui divider' />
          </div>
          <div className='column sixteen wide center aligned'>
            <p className='PendingMessage'>
              Please click on the <strong>REFRESH STATUS</strong> button above to refresh the correct stage for {domain}
            </p>
          </div>
        </div>
        {inProgress ? <RefreshInProgressContainer /> : null}
      </div>
    )
  }

  async updateStatus (domain) {
    this.setState({
      inProgress: true
    })
    try {
      await registry.updateStatus(domain)
      await PubSub.publish('DomainProfileStageMap.updateStageMap')
      this.setState({
        inProgress: false
      })
    } catch (error) {
      console.error(error)
      this.setState({
        inProgress: false
      })
      toastr.error('There was an error updating domain')
    }
  }
}

DomainPendingContainer.propTypes = {
  domain: PropTypes.string
}

export default DomainPendingContainer

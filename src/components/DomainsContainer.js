import React, { Component } from 'react'
import PropTypes from 'prop-types'
import qs from 'qs'
import updateQuery from 'update-query'

import normalizeQueryObj from '../utils/normalizeQueryObj'

import RegistryStatsbar from './RegistryStatsbar'
import AdtCalculator from './AdtCalculator'
import DomainsTable from './DomainsTable'
import DomainsFilterPanel from './DomainsFilterPanel'
import Trollbox from './Trollbox'

import './DomainsContainer.css'

class DomainsContainer extends Component {
  constructor (props) {
    super()

    const query = qs.parse(props.location.search.substr(1))

    this.state = {
      query: normalizeQueryObj(query),
      history: props.history
    }

    this.onQueryChange = this.onQueryChange.bind(this)
    this.updateTableFilters = this.updateTableFilters.bind(this)

    setTimeout(() => {
      this.updateTableFilters(query)
    }, 0)
  }

  componentWillReceiveProps (props) {
    const query = qs.parse(props.location.search.substr(1))

    this.setState({
      query: normalizeQueryObj(query)
    })

    this.updateTableFilters(query)
  }

  render () {
    const {
      query,
      history,
      tableFilters
    } = this.state

    return (
      <div className='DomainsContainer'>
        <div className='ui grid stackable padded'>
          <div className='row'>
            <div className='column ten wide'>
              <RegistryStatsbar />
            </div>
            <div className='column six wide'>
              <AdtCalculator />
            </div>
          </div>
          <div className='row'>
            <div className='column three wide'>
              <DomainsFilterPanel
                filters={query}
                onFiltersChange={this.onQueryChange}
              />
              <div className='GlobalTrollbox BoxFrame'>
                <div className='Header'>
                  Global Trollbox
                </div>
                <Trollbox
                  channel={'adchainRegistryGlobal'}
                />
              </div>
            </div>
            <div className='column thirteen wide'>
              <DomainsTable
                history={history}
                filters={tableFilters}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  onQueryChange (query) {
    const url = window.location.href
    const newQuery = updateQuery(url, query)

    window.history.replaceState({}, window.location.pathname, newQuery)

    this.setState({query})
    this.updateTableFilters(query)
  }

  // React-table filter
  updateTableFilters (query) {
    const stageFilter = {
      id: 'stage',
      value: undefined
    }

    const domainFilter = {
      id: 'domain',
      value: undefined
    }

    let filter = []

    // TODO: better way
    for (let k in query) {
      if (query[k]) {
        if (k === 'inRegistry') {
          filter.push('in_registry')
        } else if (k === 'inApplication') {
          filter.push('in_application')
        } else if (k === 'inVoting') {
          filter.push('voting_commit')
          filter.push('voting_reveal')
        } else if (k === 'inVotingCommit') {
          filter.push('voting_commit')
        } else if (k === 'inVotingReveal') {
          filter.push('voting_reveal')
        } else if (k === 'rejected') {
          filter.push('rejected')
        } else if (k === 'domain') {
          domainFilter.value = query[k]
        }
      }
    }

    filter = new RegExp(filter.join('|'), 'gi')
    stageFilter.value = filter

    this.setState({tableFilters: [domainFilter, stageFilter]})
  }
}

DomainsContainer.propTypes = {
  location: PropTypes.object,
  history: PropTypes.object
}

export default DomainsContainer

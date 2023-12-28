// Copyright (C) 2018 ConsenSys AG
//
// This file is part of uPort Mobile App.
//
// uPort Mobile App is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// uPort Mobile App is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with uPort Mobile App.  If not, see <http://www.gnu.org/licenses/>.
//
// Frameworks
import React from 'react'
import Notification from '../Notification'

const RecoveryNotification = props => {
  const handleAuthorize = () => {
    props.authorize(props.activity)
  }
  const handleCancel = () => {
    props.cancel(props.activity)
  }
  return (
    <Notification
      title='Contact Recover Request'
      cancelText='Decline'
      acceptText='Recover'
      cardPress={() => props.selectRequest(props.activity)}
      type='Recovery'
      date={typeof props.activity.authorizedAt === 'undefined' ? 0 : props.activity.authorizedAt}
      line1={
        props.activity.canceledAt
          ? `Transaction Canceled`
          : props.activity.authorizedAt
          ? `You helped a contact recover their identity`
          : `Pending Recovery Request`
      }
      line2={
        props.activity.canceledAt
          ? ''
          : props.activity.authorizedAt
          ? ''
          : `One of your contacts needs help recovering their identity`
      }
      completed={props.activity.authorizedAt}
      canceled={props.activity.canceledAt}
      cancel={handleCancel}
      accept={handleAuthorize}
      noButtons={'cancelOnly'}
    />
  )
}

export default RecoveryNotification

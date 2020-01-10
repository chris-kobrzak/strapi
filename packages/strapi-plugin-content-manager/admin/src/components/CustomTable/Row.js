import React, { memo, useCallback } from 'react';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { get, isEmpty, isNull, isObject, toLower, toString } from 'lodash';
import moment from 'moment';

import { IcoContainer, useGlobalContext } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import useListView from '../../hooks/useListView';

import CustomInputCheckbox from '../CustomInputCheckbox';
import MediaPreviewList from '../MediaPreviewList';

import { ActionContainer, Truncate, Truncated } from './styledComponents';

const isDateType = type =>
  ['date', 'time', 'datetime', 'timestamp'].includes(type);

const getDisplayedValue = (type, value, name) => {
  switch (toLower(type)) {
    case 'string':
    case 'text':
    case 'email':
    case 'enumeration':
      return (value && !isEmpty(toString(value))) || name === 'id'
        ? toString(value)
        : '-';
    case 'float':
    case 'integer':
    case 'biginteger':
    case 'decimal':
      return !isNull(value) ? toString(value) : '-';
    case 'boolean':
      return value !== null ? toString(value) : '-';
    case 'date':
    case 'time':
    case 'datetime':
    case 'timestamp': {
      if (value == null) {
        return '-';
      }

      const date =
        value && isObject(value) && value._isAMomentObject === true
          ? JSON.stringify(value)
          : value;

      return moment.parseZone(date).utc();
    }
    case 'password':
      return '••••••••';
    case 'media':
    case 'file':
    case 'files':
      return value;
    default:
      return '-';
  }
};

function Row({ goTo, isBulkable, row, headers }) {
  const {
    entriesToDelete,
    onChangeBulk,
    onClickDelete,
    schema,
  } = useListView();

  const memoizedDisplayedValue = useCallback(
    name => {
      const type = get(schema, ['attributes', name, 'type'], 'string');

      return getDisplayedValue(type, row[name], name);
    },
    [row, schema]
  );

  const { emitEvent } = useGlobalContext();

  return (
    <>
      {isBulkable && (
        <td key="i" onClick={e => e.stopPropagation()}>
          <CustomInputCheckbox
            name={row.id}
            onChange={onChangeBulk}
            value={
              entriesToDelete.filter(id => toString(id) === toString(row.id))
                .length > 0
            }
          />
        </td>
      )}
      {headers.map(header => {
        const type = get(schema, ['attributes', header.name, 'type']);

        if (type === 'media') {
          return (
            <td key={header.name}>
              <MediaPreviewList
                files={memoizedDisplayedValue(header.name)}
              ></MediaPreviewList>
            </td>
          );
        }

        if (isDateType(type)) {
          return (
            <td key={header.name}>
              <Truncate>
                <Truncated>
                  <FormattedMessage
                    id={`${pluginId}.components.CustomTable.Row.localDateFormat`}
                  >
                    {localFormat =>
                      memoizedDisplayedValue(header.name).format(localFormat)
                    }
                  </FormattedMessage>
                </Truncated>
              </Truncate>
            </td>
          );
        }

        return (
          <td key={header.name}>
            <Truncate>
              <Truncated>{memoizedDisplayedValue(header.name)}</Truncated>
            </Truncate>
          </td>
        );
      })}
      <ActionContainer>
        <IcoContainer
          style={{ minWidth: 'inherit', width: '100%', lineHeight: 48 }}
          icons={[
            {
              icoType: 'pencil-alt',
              onClick: () => {
                emitEvent('willEditEntryFromList');
                goTo(row.id);
              },
            },
            {
              id: row.id,
              icoType: 'trash',
              onClick: () => {
                emitEvent('willDeleteEntryFromList');
                onClickDelete(row.id);
              },
            },
          ]}
        />
      </ActionContainer>
    </>
  );
}

Row.propTypes = {
  goTo: PropTypes.func.isRequired,
  headers: PropTypes.array.isRequired,
  isBulkable: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
};

export default withRouter(memo(Row));

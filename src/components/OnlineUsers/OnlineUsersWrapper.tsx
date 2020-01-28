import React, {useEffect} from "react";
import OnlineUser from "./OnlineUser";
import gql from "graphql-tag";
import { useMutation, useSubscription } from "@apollo/react-hooks";
import { Online_Users, UpdateLastSeenMutation, UpdateLastSeenMutationVariables, GetOnlineUsersSubscription } from "../../generated/graphql";

const UPDATE_LASTSEEN_MUTATION=gql`
mutation updateLastSeen ($now: timestamptz!) {
  update_users(where: {}, _set: {last_seen: $now}) {
    affected_rows
  }
}
`;

const GET_ONLINE_USERS = gql`
subscription getOnlineUsers {
  online_users(order_by: {user: {name: asc }}) {
    id
    user {
      name
    }
  }
}
`;


const OnlineUsersWrapper = () => {

  const [updateLastSeen] = useMutation<UpdateLastSeenMutation, UpdateLastSeenMutationVariables>(UPDATE_LASTSEEN_MUTATION);
  const { data, loading, error } = useSubscription<GetOnlineUsersSubscription>(GET_ONLINE_USERS);

  useEffect(() => {
    const onlineIndicator = setInterval(() => updateLastSeen({variables: { now: (new Date()).toISOString()}}), 30000);
    return () => clearInterval(onlineIndicator);
  });

  if(loading) {
    return (<div>Loading...</div>);
  }
  if(error || !data) {
    return(<div>Error...</div>);
  }

  const onlineUsersList = data.online_users.map((user: Online_Users, index: number) => (
    <OnlineUser
      user={user.user}
      key={index}
    />)
  );

  return (
    <div className="onlineUsersWrapper">
      <div className="sliderHeader">
        Online users - {data.online_users.length}
      </div>
      { onlineUsersList }
    </div>
  );

}

export default OnlineUsersWrapper;

import React, { Fragment, useState, useRef, useEffect } from "react";
import gql from "graphql-tag";
import TaskItem from "./TaskItem";
import { useSubscription, useApolloClient } from "@apollo/react-hooks";

type TodoItem = {
  id: number,
  title: string,
  user: { name: string }
}

type publicListProps = {
  latestTodo?: TodoItem | null
}

const TodoPublicList = (props: publicListProps) => {
  const [olderTodosAvailable, setOlderTodosAvailable] = useState<boolean>(props.latestTodo ? true : false)
  const [newTodosCount, setNewTodosCount] = useState(0)
  const initialTodos = [
    {
      id: 1,
      title: "This is public todo 1",
      user: {
        name: "someUser1"
      }
    },
    {
      id: 2,
      title: "This is public todo 2",
      is_completed: false,
      is_public: true,
      user: {
        name: "someUser2"
      }
    },
    {
      id: 3,
      title: "This is public todo 3",
      user: {
        name: "someUser3"
      }
    },
    {
      id: 4,
      title: "This is public todo 4",
      user: {
        name: "someUser4"
      }
    }
  ];
  const [error, setError] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);

  let oldestTodoId = useRef(props.latestTodo ? props.latestTodo.id + 1 : 0);
  let newestTodoId = useRef(props.latestTodo ? props.latestTodo.id : 0);
  if(todos && todos.length) {
    oldestTodoId.current = todos[todos.length - 1].id
    newestTodoId.current = todos[0].id;
  }

  const client = useApolloClient();

  const loadOlder = async () => {
    const GET_OLD_PUBLIC_TODOS = gql`
      query getOldPublicTodos($oldestTodoId: Int!) {
        todos(
          where: { is_public: { _eq: true }, id: { _lt: $oldestTodoId } }
          limit: 7
          order_by: { created_at: desc }
        ) {
          id
          title
          created_at
          user {
            name
          }
        }
      }
    `;
    const { data, networkStatus } = await client.query({
      query: GET_OLD_PUBLIC_TODOS,
      variables: { oldestTodoId: oldestTodoId.current }
    });
    if (data.todos && data.todos.length) {
      setTodos(prevTodos => {
        if(prevTodos) {
          return [...prevTodos, ...data.todos];
        } else {
          return data.todos;
        }
      });
      oldestTodoId.current = data.todos[data.todos.length - 1].id;
    } else {
      setOlderTodosAvailable(false);
    }
    if (networkStatus === 8) {
      console.error(data);
      setError(true);
    }
  };

  const loadNew = () => {
  };

  useEffect(() => {
    loadOlder();
    // eslint-disable-next-line
  }, []);

  return (
    <Fragment>
      <div className="todoListWrapper">
        {newTodosCount !== 0 && (
          <div className={"loadMoreSection"} onClick={() => loadNew()}>
            New tasks have arrived! ({newTodosCount.toString()})
          </div>
        )}

        <ul>
          {todos &&
            todos.map((todo, index) => {
              return <TaskItem key={index} index={index} todo={todo} />;
            })}
        </ul>

        <div className={"loadMoreSection"} onClick={() => loadOlder()}>
          {olderTodosAvailable
            ? "Load older tasks"
            : "No more public tasks!"}
        </div>
      </div>
    </Fragment>
  );
};

const TodoPublicListSubscription = () => {
  // Run a subscription to get the latest public todo
  const NOTIFY_NEW_PUBLIC_TODOS = gql`
    subscription notifyNewPublicTodos {
      todos(
        where: { is_public: { _eq: true } }
        limit: 1
        order_by: { created_at: desc }
      ) {
        id
        created_at
      }
    }
  `;
  const { loading, error, data } = useSubscription(NOTIFY_NEW_PUBLIC_TODOS);
  if (loading) {
    return <span>Loading...</span>;
  }
  if (error || !data) {
    return <span>Error</span>;
  }
  return (
    <TodoPublicList latestTodo={data.todos.length ? data.todos[0] : null} />
  );
};

export default TodoPublicListSubscription;
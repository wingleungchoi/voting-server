// http://teropa.info/blog/2015/09/10/full-stack-redux-tutorial.html
import {List, Map} from 'immutable';
export const INITIAL_STATE = Map();

export function setEntries(state, entries) {
  const list = List(entries);
  return state.set('entries',        list)
              .set('initialEntries', list);
}

export function vote(voteState, entry, voter) {
  const [a, b] = voteState.get('pair');
// when entry is NOT in current pair, return old voteState; No change
// suggested answer: https://github.com/teropa/redux-voting-server/commit/exercise-1
  if ([a, b].indexOf(entry) == -1) return voteState;

  const nullifiedVoteState = nullifyVoting(voteState, entry, voter);
  const newVoteState       = recordVoting(nullifiedVoteState, entry, voter);
  return newVoteState.updateIn(
    ['tally', entry],
    0,
    tally => tally + 1
  );
}

function getWinners(vote) {
  if (!vote) return [];
  const [a, b] = vote.get('pair');
  const aVotes = vote.getIn(['tally', a], 0);
  const bVotes = vote.getIn(['tally', b], 0);
  if      (aVotes > bVotes)  return [a];
  else if (aVotes < bVotes)  return [b];
  else                       return [a, b];
}

export function next(state, round = state.getIn(['vote', 'round'], 0) ) {
  const entries = state.get('entries')
                       .concat(getWinners(state.get('vote')));
  if (entries.size === 1) {
    return state.remove('vote')
                .remove('entries')
                .set('winner', entries.first());
  } else {
    return state.merge({
      vote: Map({
        pair: entries.take(2),
        round: round + 1,
      }),
      entries: entries.skip(2)
    });
  }
}

function recordVoting(voteState, entry, voter) {
// setIn(keyPath: Array<any>, value: any): Map<K, V>
// setIn(KeyPath: Iterable<any, any>, value: any): Map<K, V>
  return voteState.setIn(
    ['votes'],
    Map([[voter, entry]])
  );
};

export function restart(state) {
  const round = state.getIn(['vote', 'round'], 0);
  return next(
    state.set('entries', state.get('initialEntries'))
         .remove('vote')
         .remove('winner'),
    round
  );
}

function nullifyVoting(voteState, entry, voter) {
  const oldEntry = voteState.getIn(['votes', voter], null);
  if(oldEntry === null){return voteState };
  return voteState.deleteIn(
    ['votes', voter]
  ).updateIn(
    ['tally', oldEntry],
    0,
    tally => tally - 1
  );
};

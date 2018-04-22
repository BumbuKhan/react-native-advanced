import React, {Component} from 'react';
import {View, Animated, PanResponder, Dimensions, StyleSheet, LayoutAnimation, UIManager} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPR_TRESHOLD = SCREEN_WIDTH / 4;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
    static defaultProps = {
        onSwipeRight: () => {},
        onSwipeLeft: () => {},
        renderNoMoreCards: () => {}
    };

    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();

        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                position.setValue({
                    x: gesture.dx,
                    y: gesture.dy
                })
            },
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dx > SWIPR_TRESHOLD) {
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPR_TRESHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });

        this.state = {panResponder, position, index: 0};
    }

    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.state.data) {
            this.setState({index: 0});
        }
    }

    forceSwipe = (direction) => {
        const x = direction === 'right'? SCREEN_WIDTH * 2: -SCREEN_WIDTH * 2;

        Animated.timing(this.state.position, {
            toValue: {x: x, y: 0},
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    };

    onSwipeComplete = (direction) => {
        const {onSwipeLeft, onSwipeRight} = this.props;
        const item = this.props.data[this.state.index];

        direction === 'left' ? onSwipeLeft(item) : onSwipeRight(item);

        this.setState({ index: this.state.index + 1 });
        this.state.position.setValue({ x: 0, y: 0 });
    };

    resetPosition = () => {
        Animated.spring(this.state.position, {
            toValue: {x: 0, y: 0}
        }).start();
    };

    getCardStyle = () => {
        const {position} = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-90deg', '0deg', '90deg']
        });

        return {
            ...position.getLayout(),
            transform: [{rotate}]
        };
    };

    renderCards = () => {
        if (this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }

        return this.props.data.map((item, i) => {
            if (i < this.state.index) {
                return null;
            }

            if (i === this.state.index) {
                return (
                    <Animated.View
                        key={item.id}
                        style={[this.getCardStyle(), styles.card]}
                        {...this.state.panResponder.panHandlers}
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }

            let _index = i - this.state.index;

            if (_index >= 3) {
                return null;
            } else {
                return (
                    <Animated.View
                        key={item.id}
                        style={[styles.card, {
                            top: 5 * (i - this.state.index),
                            width: SCREEN_WIDTH - (2 * (5 * _index)),
                            marginLeft: 5 * _index
                        }]}>
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }
        }).reverse();
    };

    render() {
        return (
            <View>
                {this.renderCards()}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
});

export default Deck;